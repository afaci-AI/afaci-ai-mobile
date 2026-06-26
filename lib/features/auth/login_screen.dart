import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/brand.dart';
import '../../app/providers.dart';
import '../../app/widgets.dart';
import '../../core/network/api_exception.dart';

/// Экран входа/регистрации одним переключателем — как на сайте
/// (`app/login/page.tsx`). Бренд-иконка AFACI, показ/скрытие пароля,
/// тумблер «Войти ⇄ Зарегистрироваться».
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({this.initialRegister = false, super.key});
  final bool initialRegister;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _name = TextEditingController();
  final _password = TextEditingController();

  late bool _register = widget.initialRegister;
  bool _obscure = true;
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _name.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    // Захватываем роутер ДО await: смена сессии триггерит refresh go_router,
    // который может пересобрать дерево и уничтожить этот State (mounted=false).
    // Ссылка на GoRouter стабильна и переживает пересборку.
    final router = GoRouter.of(context);
    setState(() => _loading = true);
    try {
      final session = ref.read(sessionProvider.notifier);
      if (_register) {
        await session.register(
          _email.text.trim(),
          _name.text.trim(),
          _password.text,
        );
      } else {
        await session.login(_email.text.trim(), _password.text);
      }
      // Вход выполнен. go('/') сбрасывает весь стек, включая императивно
      // запушенный '/login' — redirect его при refresh не видит, поэтому
      // закрываем экран здесь явно.
      router.go('/');
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _form,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Center(
                          child: BrandMark(size: 48, showText: false),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _register ? 'Регистрация' : 'Вход в AFACI',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _register
                              ? 'Создайте аккаунт для доступа к калькулятору и сохранённым рецептурам'
                              : 'Войдите, чтобы пользоваться калькулятором и сохранять рецептуры',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        const SizedBox(height: 24),
                        if (_register) ...[
                          TextFormField(
                            controller: _name,
                            decoration: const InputDecoration(
                              labelText: 'Имя',
                              hintText: 'Как к вам обращаться',
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty)
                                ? 'Введите имя'
                                : null,
                          ),
                          const SizedBox(height: 14),
                        ],
                        TextFormField(
                          controller: _email,
                          keyboardType: TextInputType.emailAddress,
                          autocorrect: false,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            hintText: 'email@example.com',
                          ),
                          validator: (v) => (v == null || !v.contains('@'))
                              ? 'Введите корректный email'
                              : null,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _password,
                          obscureText: _obscure,
                          decoration: InputDecoration(
                            labelText: 'Пароль',
                            hintText: _register
                                ? 'Минимум 6 символов'
                                : 'Введите пароль',
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscure
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                              ),
                              onPressed: () =>
                                  setState(() => _obscure = !_obscure),
                            ),
                          ),
                          validator: (v) => (v == null || v.length < 6)
                              ? 'Минимум 6 символов'
                              : null,
                        ),
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: _loading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  _register ? 'Зарегистрироваться' : 'Войти',
                                ),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: _loading
                              ? null
                              : () => setState(() => _register = !_register),
                          child: Text(
                            _register
                                ? 'Уже есть аккаунт? Войти'
                                : 'Нет аккаунта? Зарегистрироваться',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
