import { useRouter } from 'expo-router'
import { KeyRound } from 'lucide-react-native'
import { useState } from 'react'

import { authApi } from '@/shared/api/auth'
import { Box } from '@/shared/ui/box'
import { Button, FormField, Input } from '@/shared/ui/kit'

import { errorText, resendDeadline, resetDraft } from './draft'
import { ErrorBox, ResetLayout } from './reset-layout'

/** Шаг 1: email аккаунта, на который придёт код. */
export function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState(resetDraft.email)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const sendCode = async () => {
    const value = email.trim()
    setError('')
    if (!value) {
      setError('Укажите email.')
      return
    }
    setBusy(true)
    try {
      const res = await authApi.requestPasswordReset(value)
      resetDraft.email = value
      resetDraft.code = ''
      resetDraft.notice = res.message
      resetDraft.resendAt = resendDeadline(res.resend_after)
      router.push('/forgot-password/code')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResetLayout
      icon={KeyRound}
      title="Забыли пароль?"
      subtitle="Укажите email аккаунта — пришлём код подтверждения"
      onBack={() => {
        resetDraft.clear()
        router.replace('/login')
      }}
    >
      <Box className="gap-4">
        <FormField label="Email">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            isDisabled={busy}
          />
        </FormField>
        <ErrorBox message={error} />
        <Button
          label={busy ? 'Отправка…' : 'Получить код'}
          isLoading={busy}
          onPress={() => void sendCode()}
        />
      </Box>
    </ResetLayout>
  )
}
