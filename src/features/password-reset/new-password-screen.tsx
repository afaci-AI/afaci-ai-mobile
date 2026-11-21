import { Redirect, useRouter } from 'expo-router'
import { CircleCheck, ShieldCheck } from 'lucide-react-native'
import { useState } from 'react'

import { authApi } from '@/shared/api/auth'
import { Box } from '@/shared/ui/box'
import { Button, FormField, Input } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

import { errorText, resetDraft } from './draft'
import { ErrorBox, ResetLayout } from './reset-layout'

function validate(password: string, repeat: string) {
  if (password.length < 6) return 'Пароль должен быть не короче 6 символов.'
  if (password !== repeat) return 'Пароли не совпадают.'
  return null
}

/** Шаг 3: код уже подтверждён — задаём новый пароль. */
export function NewPasswordScreen() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const toLogin = () => {
    resetDraft.clear()
    router.replace('/login')
  }

  if (!done && (!resetDraft.email || !resetDraft.code))
    return <Redirect href="/forgot-password" />

  if (done)
    return (
      <ResetLayout
        icon={CircleCheck}
        title="Пароль изменён"
        subtitle="Войдите с новым паролем"
        onBack={toLogin}
      >
        <Box className="gap-4">
          <Text
            size={FontSize.sm}
            className="text-center text-muted-foreground"
          >
            На других устройствах потребуется войти заново.
          </Text>
          <Button label="Перейти ко входу" onPress={toLogin} />
        </Box>
      </ResetLayout>
    )

  const save = async () => {
    const invalid = validate(password, repeat)
    setError(invalid ?? '')
    if (invalid) return
    setBusy(true)
    try {
      await authApi.confirmPasswordReset({
        email: resetDraft.email,
        code: resetDraft.code,
        new_password: password,
      })
      setDone(true)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResetLayout
      icon={ShieldCheck}
      title="Новый пароль"
      subtitle="Код подтверждён. Придумайте новый пароль"
      onBack={() => router.replace('/forgot-password/code')}
    >
      <Box className="gap-4">
        <FormField label="Новый пароль" hint="Не короче 6 символов">
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            autoFocus
            isDisabled={busy}
          />
        </FormField>
        <FormField label="Повторите пароль">
          <Input
            value={repeat}
            onChangeText={setRepeat}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            isDisabled={busy}
          />
        </FormField>
        <ErrorBox message={error} />
        <Button
          label={busy ? 'Сохранение…' : 'Сохранить пароль'}
          isLoading={busy}
          onPress={() => void save()}
        />
      </Box>
    </ResetLayout>
  )
}
