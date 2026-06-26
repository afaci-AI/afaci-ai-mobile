import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/network/api_exception.dart';
import '../../domain/product.dart';
import '../database/database_providers.dart';

/// Переиспользуемый список продуктов: поиск + фильтры (категория, регион) +
/// бесконечная подгрузка по 10 (см. «База данных»).
///
/// Используется и на экране «База данных», и при добавлении/редактировании
/// ингредиента в калькуляторе — чтобы логика пагинации не дублировалась.
class ProductBrowser extends ConsumerStatefulWidget {
  const ProductBrowser({required this.onSelect, this.selectedId, super.key});

  /// Колбэк выбора продукта (тап по карточке).
  final void Function(Product product) onSelect;

  /// Подсветить выбранный продукт (для режима выбора ингредиента).
  final String? selectedId;

  @override
  ConsumerState<ProductBrowser> createState() => _ProductBrowserState();
}

class _ProductBrowserState extends ConsumerState<ProductBrowser> {
  final _searchCtrl = TextEditingController();
  Timer? _debounce;

  String _query = '';
  String? _category;
  String? _region;

  static const int _pageSize = 10;
  static const int _prefetchTail = 3;

  final List<Product> _items = [];
  int _offset = 0;
  bool _hasMore = true;
  bool _loadingFirst = false;
  bool _loadingMore = false;
  Object? _error;
  int _requestId = 0;

  @override
  void initState() {
    super.initState();
    _loadFirst();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<List<Product>> _fetch(int offset) => ref
      .read(productsApiProvider)
      .search(
        query: _query,
        region: _region,
        category: _category,
        limit: _pageSize,
        offset: offset,
      );

  Future<void> _loadFirst() async {
    final reqId = ++_requestId;
    setState(() {
      _items.clear();
      _offset = 0;
      _hasMore = true;
      _error = null;
      _loadingFirst = true;
    });
    try {
      final batch = await _fetch(0);
      if (reqId != _requestId || !mounted) return;
      setState(() {
        _items.addAll(batch);
        _offset = batch.length;
        _hasMore = batch.length == _pageSize;
        _loadingFirst = false;
      });
    } catch (e) {
      if (reqId != _requestId || !mounted) return;
      setState(() {
        _error = e;
        _loadingFirst = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _loadingFirst || !_hasMore) return;
    final reqId = _requestId;
    setState(() => _loadingMore = true);
    try {
      final batch = await _fetch(_offset);
      if (reqId != _requestId || !mounted) return;
      setState(() {
        _items.addAll(batch);
        _offset += batch.length;
        _hasMore = batch.length == _pageSize;
        _loadingMore = false;
      });
    } catch (_) {
      if (reqId != _requestId || !mounted) return;
      setState(() => _loadingMore = false);
    }
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _query = value;
      _loadFirst();
    });
  }

  bool get _hasFilters =>
      _query.isNotEmpty || _category != null || _region != null;

  void _resetFilters() {
    _searchCtrl.clear();
    _query = '';
    _category = null;
    _region = null;
    _loadFirst();
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final regionsAsync = ref.watch(regionsProvider);

    return Column(
      children: [
        // ---- поиск + фильтры ----
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
          child: Column(
            children: [
              TextField(
                controller: _searchCtrl,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search),
                  hintText: 'Поиск по названию продукта…',
                ),
                onChanged: _onQueryChanged,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _FilterDropdown(
                      hint: 'Категория',
                      value: _category,
                      itemsAsync: categoriesAsync,
                      onChanged: (v) {
                        _category = v;
                        _loadFirst();
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _FilterDropdown(
                      hint: 'Регион',
                      value: _region,
                      itemsAsync: regionsAsync,
                      onChanged: (v) {
                        _region = v;
                        _loadFirst();
                      },
                    ),
                  ),
                  if (_hasFilters) ...[
                    const SizedBox(width: 4),
                    IconButton(
                      tooltip: 'Сбросить',
                      onPressed: _resetFilters,
                      icon: const Icon(Icons.close),
                      style: IconButton.styleFrom(
                        backgroundColor: Theme.of(
                          context,
                        ).colorScheme.errorContainer,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(child: _buildList(context)),
      ],
    );
  }

  Widget _buildList(BuildContext context) {
    if (_loadingFirst) return const LoadingView();
    if (_error != null) {
      final e = _error;
      return ErrorView(
        e is ApiException ? e.message : 'Не удалось загрузить данные',
        onRetry: _loadFirst,
      );
    }
    if (_items.isEmpty) {
      return const EmptyView(
        'Продукты не найдены',
        icon: Icons.inventory_2_outlined,
      );
    }
    return RefreshIndicator(
      onRefresh: _loadFirst,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        itemCount: _items.length + 1,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, i) {
          if (i >= _items.length) return _buildFooter(context);
          if (_hasMore && i >= _items.length - _prefetchTail) {
            WidgetsBinding.instance.addPostFrameCallback((_) => _loadMore());
          }
          final p = _items[i];
          return ProductCard(
            product: p,
            selected: widget.selectedId == p.id,
            onTap: () => widget.onSelect(p),
          );
        },
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    if (_loadingMore) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }
    if (!_hasMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: Text(
            'Показаны все продукты (${_items.length})',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ),
      );
    }
    return const SizedBox(height: 8);
  }
}

class _FilterDropdown extends StatelessWidget {
  const _FilterDropdown({
    required this.hint,
    required this.value,
    required this.itemsAsync,
    required this.onChanged,
  });

  final String hint;
  final String? value;
  final AsyncValue<List<String>> itemsAsync;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final items = itemsAsync.asData?.value ?? const <String>[];
    return DropdownButtonFormField<String?>(
      value: value,
      isExpanded: true,
      decoration: InputDecoration(
        hintText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: [
        DropdownMenuItem(value: null, child: Text('Все: $hint')),
        ...items.map((e) => DropdownMenuItem(value: e, child: Text(e))),
      ],
      onChanged: onChanged,
    );
  }
}

/// Карточка продукта с бейджами (категория / подкатегория / регион).
class ProductCard extends StatelessWidget {
  const ProductCard({
    required this.product,
    required this.onTap,
    this.selected = false,
    super.key,
  });

  final Product product;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: selected ? scheme.primary : scheme.outline,
          width: selected ? 1.5 : 1,
        ),
      ),
      color: selected ? scheme.primaryContainer : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: scheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.inventory_2_outlined,
                      color: scheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      product.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    selected ? Icons.check_circle : Icons.chevron_right,
                    color: selected ? scheme.primary : scheme.onSurfaceVariant,
                  ),
                ],
              ),
              if (product.category != null ||
                  product.subcategory != null ||
                  product.region != null) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (product.category != null)
                      _tag(context, Icons.folder_outlined, product.category!),
                    if (product.subcategory != null)
                      _tag(
                        context,
                        Icons.layers_outlined,
                        product.subcategory!,
                      ),
                    if (product.region != null)
                      _tag(context, Icons.place_outlined, product.region!),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(BuildContext context, IconData icon, String label) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHigh,
        border: Border.all(color: scheme.outline),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: scheme.onSurfaceVariant),
          const SizedBox(width: 4),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}
