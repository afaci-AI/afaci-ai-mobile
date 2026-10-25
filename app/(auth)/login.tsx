import { zodResolver } from '@hookform/resolvers/zod'
import { useFocusEffect, useRouter } from 'expo-router'
import { Database, Eye, EyeOff } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BackHandler, Platform } from 'react-native'
import { z } from 'zod'

import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Button, Card, FormField, Header, Input, Screen } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { KeyboardAvoidingView } from '@/shared/ui/keyboard-avoiding-view'
import { ScrollView } from '@/shared/ui/scroll-view'

const loginSchema = z.object({
  email: z.string().min(1, 'Укажите email').email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const router = useRouter()
  const login = useSession((state) => state.login)
  const goBack = useCallback(() => {
    // История может вести в защищённую вкладку и снова открыть вход.
    router.replace('/')
  }, [router])

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          goBack()
          return true
        },
      )
      return () => subscription.remove()
    }, [goBack]),
  )

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError('')
    try {
      // Навигацию после входа выполняет AuthRedirect — там же проверяется next.
      await login(values.email.trim(), values.password)
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : 'Не удалось войти. Попробуйте позже.',
      )
    }
  })

  return (
    <Screen>
      <Header title="Вход" onBack={goBack} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="grow justify-center p-4"
          keyboardShouldPersistTaps="handled"
        >
          <Card className="gap-6">
            <Box className="items-center gap-2">
              <Box className="mb-1 h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Icon
                  as={Database}
                  size="lg"
                  className="text-primary-foreground"
                />
              </Box>
              <Heading size="2xl" className="text-center text-card-foreground">
                Вход в AFACI
              </Heading>
              <Text size="sm" className="text-center text-muted-foreground">
                Войдите, чтобы пользоваться калькулятором и сохранять рецептуры
              </Text>
            </Box>

            <Box className="gap-4">
              <FormField label="Email" error={errors.email?.message}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      isInvalid={Boolean(errors.email)}
                      isDisabled={isSubmitting}
                    />
                  )}
                />
              </FormField>

              <FormField label="Пароль" error={errors.password?.message}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Введите пароль"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="current-password"
                      isInvalid={Boolean(errors.password)}
                      isDisabled={isSubmitting}
                      rightSlot={
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            showPassword ? 'Скрыть пароль' : 'Показать пароль'
                          }
                          onPress={() => setShowPassword((value) => !value)}
                          className="p-1"
                        >
                          <Icon
                            as={showPassword ? EyeOff : Eye}
                            size="sm"
                            className="text-muted-foreground"
                          />
                        </Pressable>
                      }
                    />
                  )}
                />
              </FormField>

              {serverError ? (
                <Box className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
                  <Text size="sm" className="text-destructive-text">
                    {serverError}
                  </Text>
                </Box>
              ) : null}

              <Button
                label={isSubmitting ? 'Вход…' : 'Войти'}
                isLoading={isSubmitting}
                onPress={() => {
                  void onSubmit()
                }}
              />
            </Box>
          </Card>

          <Text size="sm" className="mt-6 text-center text-muted-foreground">
            Нет аккаунта? Обратитесь к администратору.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
