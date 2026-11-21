import { Redirect, useRouter } from 'expo-router'
import { MailCheck } from 'lucide-react-native'
import { useEffect, useState } from 'react'

import { authApi } from '@/shared/api/auth'
import { Box } from '@/shared/ui/box'
import { Button, OtpInput } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

import { errorText, formatSeconds, resendDeadline, resetDraft } from './draft'
import { ErrorBox, ResetLayout } from './reset-layout'

const CODE_LENGTH = 6

/** Шаг 2: код из письма по ячейкам; при верном коде — экран нового пароля. */
export function ResetCodeScreen() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState(resetDraft.notice)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendAt, setResendAt] = useState(resetDraft.resendAt)
  const [now, setNow] = useState(() => Date.now())
  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000))

  useEffect(() => {
    if (resendAt <= Date.now()) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [resendAt])

  if (!resetDraft.email) return <Redirect href="/forgot-password" />

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH) {
      setError('Введите все 6 цифр кода.')
      return
    }
    setError('')
    setBusy(true)
    try {
      await authApi.verifyPasswordReset({
        email: resetDraft.email,
        code: value,
      })
      resetDraft.code = value
      router.replace('/forgot-password/new-password')
    } catch (err) {
      setCode('')
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    setBusy(true)
    try {
      const res = await authApi.requestPasswordReset(resetDraft.email)
      setNotice(res.message)
      resetDraft.resendAt = resendDeadline(res.resend_after)
      setResendAt(resetDraft.resendAt)
      setNow(Date.now())
      setCode('')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ResetLayout
      icon={MailCheck}
      title="Введите код"
      subtitle={`Шесть цифр из письма на ${resetDraft.email}`}
      onBack={() => router.back()}
    >
      <Box className="gap-5">
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value)
            if (error) setError('')
          }}
          onComplete={(value) => void verify(value)}
          length={CODE_LENGTH}
          isInvalid={Boolean(error)}
          isDisabled={busy}
          autoFocus
        />
        <ErrorBox message={error} />
        <Button
          label={busy ? 'Проверка…' : 'Подтвердить'}
          isLoading={busy}
          onPress={() => void verify(code)}
        />
        <Text size={FontSize.sm} className="text-center text-muted-foreground">
          {notice}
        </Text>
        <Button
          label={
            resendIn > 0
              ? `Отправить ещё раз через ${formatSeconds(resendIn)}`
              : 'Отправить код ещё раз'
          }
          variant="outline"
          isDisabled={busy || resendIn > 0}
          onPress={() => void resend()}
        />
        <Button
          label="Изменить email"
          variant="link"
          isDisabled={busy}
          onPress={() => router.back()}
        />
      </Box>
    </ResetLayout>
  )
}
