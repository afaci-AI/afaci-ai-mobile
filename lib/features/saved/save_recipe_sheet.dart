import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/network/api_exception.dart';
import '../../domain/saved_recipe.dart';
import 'saved_providers.dart';

/// Лист сохранения рецептуры из калькулятора (план, Шаг 7).
///
/// Поддерживает: выбор существующей группы, создание новой «на лету»
/// (`new_group_name`) и черновик (`draft` — без расчёта метрик).
class SaveRecipeSheet extends ConsumerStatefulWidget {
  const SaveRecipeSheet({
    required this.referenceProteinId,
    required this.items,
    super.key,
  });

  final String? referenceProteinId;
  final List<SavedRecipeItem> items;

  static Future<bool?> show(
    BuildContext context, {
    required String? referenceProteinId,
    required List<SavedRecipeItem> items,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SaveRecipeSheet(
          referenceProteinId: referenceProteinId,
          items: items,
        ),
      ),
    );
  }

  @override
  ConsumerState<SaveRecipeSheet> createState() => _SaveRecipeSheetState();
}

const _newGroupSentinel = '__new__';

class _SaveRecipeSheetState extends ConsumerState<SaveRecipeSheet> {
  final _name = TextEditingController();
  final _newGroup = TextEditingController();
  String? _groupId; // null = без группы, _newGroupSentinel = новая
  bool _draft = false;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _newGroup.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      showSnack(context, 'Введите название рецептуры', error: true);
      return;
    }
    if (widget.referenceProteinId == null) {
      showSnack(context, 'Сначала выберите эталонный белок', error: true);
      return;
    }
    setState(() => _saving = true);
    try {
      await ref
          .read(savedApiProvider)
          .createRecipe(
            name: _name.text.trim(),
            referenceProteinId: widget.referenceProteinId!,
            items: widget.items,
            groupId: _groupId == _newGroupSentinel ? null : _groupId,
            newGroupName: _groupId == _newGroupSentinel ? _newGroup.text : null,
            draft: _draft,
          );
      invalidateSaved(ref);
      if (mounted) {
        Navigator.of(context).pop(true);
        showSnack(context, 'Рецептура сохранена');
      }
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final groupsAsync = ref.watch(recipeGroupsProvider);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Сохранить рецептуру',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _name,
            decoration: const InputDecoration(labelText: 'Название'),
            autofocus: true,
          ),
          const SizedBox(height: 12),
          groupsAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => const SizedBox.shrink(),
            data: (groups) {
              return DropdownButtonFormField<String?>(
                value: _groupId,
                isExpanded: true,
                decoration: const InputDecoration(labelText: 'Группа'),
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('Без группы'),
                  ),
                  ...groups.map(
                    (g) => DropdownMenuItem(value: g.id, child: Text(g.name)),
                  ),
                  const DropdownMenuItem(
                    value: _newGroupSentinel,
                    child: Text('+ Новая группа…'),
                  ),
                ],
                onChanged: (v) => setState(() => _groupId = v),
              );
            },
          ),
          if (_groupId == _newGroupSentinel) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _newGroup,
              decoration: const InputDecoration(
                labelText: 'Название новой группы',
              ),
            ),
          ],
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Черновик'),
            subtitle: const Text('Сохранить без расчёта метрик'),
            value: _draft,
            onChanged: (v) => setState(() => _draft = v),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Сохранить'),
          ),
        ],
      ),
    );
  }
}
