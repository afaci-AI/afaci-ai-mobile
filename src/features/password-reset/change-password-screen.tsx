import { Redirect, useRouter } from 'expo-router'
import { ShieldCheck } from 'lucide-react-native'
import { useState } from 'react'

import { authApi } from '@/shared/api/auth'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Button, FormField, Input } from '@/shared/ui/kit'

import { errorText } from './draft'
import { ErrorBox, ResetLayout } from './reset-layout'

function validate(current: string, password: string, repeat: string) {
  if (!current) return 'Укажите текущий пароль.'
  if (password.length < 6)
    return 'Новый пароль должен быть не короче 6 символов.'
  if (password === current) return 'Новый пароль должен отличаться от текущего.'
  if (password !== repeat) return 'Пароли не совпадают.'
  return null
}

/** Смена пароля; после входа с временным паролем — обязательная. */
export function ChangePasswordScreen() {
  const router = useRouter()
  const user = useSession((state) => state.user)
  const status = useSession((state) => state.status)
  const logout = useSession((state) => state.logout)
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (status === 'guest') return <Redirect href="/login" />
  if (!user) return null
  const required = user.mustChangePassword

  const save = async () => {
    const invalid = validate(current, password, repeat)
    setError(invalid ?? '')
    if (invalid) return
    setBusy(true)
    try {
      await authApi.changePassword({
        current_password: current,
        new_password: password,
      })
      useSession.setState({ user: { ...user, mustChangePassword: false } })
      router.replace('/calculator')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResetLayout
      header="Смена пароля"
      icon={ShieldCheck}
      title={required ? 'Задайте свой пароль' : 'Смена пароля'}
      subtitle={
        required
          ? 'Вы вошли с временным паролем из письма. Чтобы продолжить, придумайте собственный.'
          : 'Введите текущий пароль и новый'
      }
      onBack={() => {
        if (required) void logout()
        else router.back()
      }}
    >
      <Box className="gap-4">
        <FormField
          label={required ? 'Временный пароль из письма' : 'Текущий пароль'}
        >
          <Input
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            isDisabled={busy}
          />
        </FormField>
        <FormField label="Новый пароль" hint="Не короче 6 символов">
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
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
        {required ? (
          <Button
            label="Выйти"
            variant="link"
            isDisabled={busy}
            onPress={() => void logout()}
          />
        ) : null}
      </Box>
    </ResetLayout>
  )
}
