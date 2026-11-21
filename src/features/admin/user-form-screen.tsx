import { useState } from 'react'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import type { User, UserRole } from '@/shared/api/models'
import { useSession } from '@/shared/session/store'
import { VStack } from '@/shared/ui/vstack'
import { Text } from '@/shared/ui/text'
import {
  Button,
  ErrorState,
  FormField,
  Header,
  Input,
  LoadingView,
  ScrollScreen,
  Select,
  SwitchRow,
  useAppToast,
} from '@/shared/ui/kit'
import { assertUserAdmin, getAdminUser, saveUser, userRoles } from './users-api'

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось сохранить пользователя.'
export function AdminUserFormScreen({ edit = false }: { edit?: boolean }) {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const admin = useSession((s) => s.user?.role === 'admin')
  const user = useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => getAdminUser(id),
    enabled: edit && Boolean(id) && admin,
  })
  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/admin/users')
  return (
    <ScrollScreen>
      <Header
        title={edit ? 'Редактировать пользователя' : 'Новый пользователь'}
        onBack={back}
      />
      {!admin ? (
        <Text className="text-destructive-text">
          Доступно только администратору.
        </Text>
      ) : edit && user.isPending ? (
        <LoadingView fullscreen={false} />
      ) : edit && user.error ? (
        <ErrorState
          message={message(user.error)}
          onRetry={() => void user.refetch()}
        />
      ) : (
        <UserForm
          key={edit ? user.data?.id : 'new'}
          user={edit ? user.data : undefined}
          onBack={back}
        />
      )}
    </ScrollScreen>
  )
}
function UserForm({ user, onBack }: { user?: User; onBack: () => void }) {
  const currentOwner = useSession((s) => s.user?.id)
  const [owner] = useState(currentOwner)
  const self = user?.id === owner
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'viewer')
  const [unlimited, setUnlimited] = useState(!user?.accessExpiresAt)
  const [expiry, setExpiry] = useState(() =>
    user?.accessExpiresAt
      ? new Date(user.accessExpiresAt)
      : new Date(Date.now() + 30 * 86400000),
  )
  const [submitted, setSubmitted] = useState(false)
  const [validationTime, setValidationTime] = useState(() => Date.now())
  const client = useQueryClient()
  const toast = useAppToast()
  const errors = {
    name: !name.trim() ? 'Укажите имя.' : undefined,
    email:
      !user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? 'Укажите корректный email.'
        : undefined,
    expiry:
      !unlimited &&
      (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= validationTime)
        ? 'Выберите дату и время в будущем.'
        : undefined,
  }
  const save = useMutation({
    mutationFn: async () => {
      assertUserAdmin(owner)
      if (!unlimited && expiry.getTime() <= Date.now())
        throw new Error('Выберите дату и время в будущем.')
      if (Object.values(errors).some(Boolean))
        throw new Error('Проверьте поля формы.')
      return saveUser(user?.id, {
        name: name.trim(),
        role,
        access_expires_at: unlimited ? null : expiry.toISOString(),
        ...(user
          ? { access_expires_at_unlimited: unlimited }
          : { email: email.trim() }),
      })
    },
    onSuccess: async ({ user: saved, credentialsEmail }) => {
      if (useSession.getState().user?.id !== owner) return
      await client.invalidateQueries({ queryKey: ['admin', 'users'] })
      if (
        useSession.getState().user?.id !== owner ||
        useSession.getState().user?.role !== 'admin'
      )
        return
      if (self) useSession.setState({ user: saved })
      if (credentialsEmail && !credentialsEmail.sent)
        toast.error({
          title: 'Пользователь создан, но письмо не отправлено',
          description: `${credentialsEmail.error ?? ''} Повторите отправку кнопкой с конвертом в списке.`,
        })
      else
        toast.success({
          title: user ? 'Пользователь сохранён' : 'Пользователь создан',
          description: user
            ? undefined
            : `Логин и временный пароль отправлены на ${saved.email}`,
        })
      onBack()
    },
  })
  // Android's system date/time dialogs are native integrations without a gluestack wrapper.
  const pick = (mode: 'date' | 'time') =>
    DateTimePickerAndroid.open({
      value: expiry,
      mode,
      is24Hour: true,
      ...(mode === 'date' ? { minimumDate: new Date() } : {}),
      onChange: (event, selected) => {
        if (event.type !== 'set' || !selected) return
        const next = new Date(expiry)
        if (mode === 'date')
          next.setFullYear(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
          )
        else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
        setExpiry(next)
      },
    })
  return (
    <VStack space="lg">
      <FormField
        label="Имя"
        isRequired
        error={submitted ? errors.name : undefined}
      >
        <Input
          accessibilityLabel="Имя пользователя"
          value={name}
          onChangeText={setName}
          isDisabled={save.isPending}
        />
      </FormField>
      {user ? (
        <Text className="text-muted-foreground">{user.email}</Text>
      ) : (
        <>
          <FormField
            label="Email"
            isRequired
            error={submitted ? errors.email : undefined}
          >
            <Input
              accessibilityLabel="Email пользователя"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              isDisabled={save.isPending}
            />
          </FormField>
          <Text className="rounded-md border border-dashed border-border p-3 text-muted-foreground">
            Пароль задавать не нужно: система создаст временный и отправит его
            вместе с логином на этот email. При первом входе пользователь задаст
            собственный пароль.
          </Text>
        </>
      )}
      <FormField label="Роль">
        <Select
          value={role}
          options={userRoles}
          onChange={(value) => setRole(value as UserRole)}
          isDisabled={self || save.isPending}
        />
      </FormField>
      {self ? (
        <Text className="text-muted-foreground">
          Роль собственной учётной записи изменить нельзя.
        </Text>
      ) : null}
      <SwitchRow
        label="Безлимитный доступ"
        description="Без ограничения по сроку"
        value={unlimited}
        onValueChange={setUnlimited}
        isDisabled={save.isPending}
      />
      {!unlimited ? (
        <FormField
          label="Окончание доступа"
          isRequired
          error={submitted ? errors.expiry : undefined}
        >
          <VStack space="sm">
            <Text className="text-muted-foreground">
              Время устройства:{' '}
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </Text>
            <Button
              label={expiry.toLocaleDateString('ru-RU')}
              variant="outline"
              accessibilityLabel="Выбрать дату окончания доступа"
              isDisabled={save.isPending}
              onPress={() => pick('date')}
            />
            <Button
              label={expiry.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              variant="outline"
              accessibilityLabel="Выбрать время окончания доступа"
              isDisabled={save.isPending}
              onPress={() => pick('time')}
            />
          </VStack>
        </FormField>
      ) : null}
      {save.error ? (
        <Text accessibilityRole="alert" className="text-destructive-text">
          {message(save.error)}
        </Text>
      ) : null}
      <Button
        label="Сохранить"
        isLoading={save.isPending}
        onPress={() => {
          setValidationTime(Date.now())
          setSubmitted(true)
          if (!Object.values(errors).some(Boolean)) save.mutate()
        }}
      />
      <Button
        label="Отмена"
        variant="outline"
        isDisabled={save.isPending}
        onPress={onBack}
      />
    </VStack>
  )
}
