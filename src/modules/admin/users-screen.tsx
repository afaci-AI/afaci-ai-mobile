import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import {
  Lock,
  LockOpen,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react-native'
import { Badge, BadgeText } from '@/shared/ui/badge'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { HStack } from '@/shared/ui/hstack'
import { Box } from '@/shared/ui/box'
import { Icon } from '@/shared/ui/icon'
import { Pressable } from '@/shared/ui/pressable'
import { useAdminUserFilters } from './user-filters-store'
import type { User, UserStatus } from '@/shared/api/models'
import { useSession } from '@/shared/session/store'
import { FlatList } from '@/shared/ui/flat-list'
import { VStack } from '@/shared/ui/vstack'
import { Text } from '@/shared/ui/text'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Header,
  Input,
  LoadingView,
  Screen,
  useAppToast,
} from '@/shared/ui/kit'
import {
  assertUserAdmin,
  changeUserState,
  getUserStatus,
  listUsers,
  userRoles,
  userStatuses,
} from './users-api'
import { FontSize } from '@/shared/theme/font-sizes'

const statusVariants = {
  active: 'success',
  unlimited: 'info',
  blocked: 'destructive',
  expired: 'warning',
} as const satisfies Record<UserStatus, string>

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить действие.'
export function AdminUsersScreen() {
  const owner = useSession((s) => s.user)
  const [sessionOwner] = useState(owner?.id)
  const search = useAdminUserFilters((state) => state.search)
  const setSearch = useAdminUserFilters((state) => state.setSearch)
  const role = useAdminUserFilters((state) => state.role)
  const status = useAdminUserFilters((state) => state.status)
  const activeFilterCount = [role, status].filter(Boolean).length
  const [action, setAction] = useState<{
    user: User
    type: 'block' | 'unblock' | 'delete'
  } | null>(null)
  const client = useQueryClient()
  const toast = useAppToast()
  const users = useQuery({
    queryKey: ['admin', 'users', search, role],
    queryFn: () => listUsers(search, role),
    enabled: owner?.role === 'admin',
  })
  const mutation = useMutation({
    mutationFn: async () => {
      assertUserAdmin(sessionOwner)
      if (!action) throw new Error('Выберите пользователя.')
      return changeUserState(action.user, action.type)
    },
    onSuccess: async () => {
      if (useSession.getState().user?.id !== owner?.id) return
      await client.invalidateQueries({ queryKey: ['admin', 'users'] })
      if (
        useSession.getState().user?.id !== sessionOwner ||
        useSession.getState().user?.role !== 'admin'
      )
        return
      setAction(null)
      toast.success({ title: 'Изменения сохранены' })
    },
  })
  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/admin')
  if (owner?.role !== 'admin')
    return (
      <Screen>
        <Header title="Пользователи" onBack={back} />
        <Text className="p-4 text-destructive-text">
          Доступно только администратору.
        </Text>
      </Screen>
    )
  return (
    <Screen>
      <FlatList
        data={
          users.error
            ? []
            : (users.data ?? []).filter(
                (user) => !status || getUserStatus(user) === status,
              )
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12, padding: 16 }}
        keyboardShouldPersistTaps="handled"
        refreshing={users.isRefetching}
        onRefresh={() => void users.refetch()}
        ListHeaderComponent={
          <VStack space="md">
            <Header title="Пользователи" onBack={back} />
            <Button
              label="Создать пользователя"
              onPress={() => router.push('/admin/users/new')}
            />
            <HStack space="sm" className="items-center">
              <Box className="flex-1">
                <Input
                  leadingIcon={Search}
                  accessibilityLabel="Поиск пользователей по имени или email"
                  placeholder="Имя или email"
                  value={search}
                  onChangeText={setSearch}
                />
              </Box>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  activeFilterCount
                    ? `Фильтры, выбрано: ${activeFilterCount}`
                    : 'Фильтры пользователей'
                }
                onPress={() => router.push('/admin/users/filters')}
                className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-background data-[active=true]:bg-muted"
              >
                <Icon
                  as={SlidersHorizontal}
                  size="md"
                  className="text-foreground"
                />
                {activeFilterCount ? (
                  <Box className="absolute right-1 top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
                    <Text
                      size={FontSize.xs}
                      className="text-primary-foreground"
                    >
                      {activeFilterCount}
                    </Text>
                  </Box>
                ) : null}
              </Pressable>
            </HStack>
            {users.error ? (
              <ErrorState
                message={message(users.error)}
                onRetry={() => void users.refetch()}
              />
            ) : null}
          </VStack>
        }
        ListEmptyComponent={
          users.isPending ? (
            <LoadingView fullscreen={false} />
          ) : !users.error ? (
            <EmptyState
              title="Пользователи не найдены"
              description="Измените поиск или фильтры."
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <Card>
            <VStack space="sm">
              <Text bold className="text-foreground">
                {item.name}
                {item.id === owner.id ? ' (вы)' : ''}
              </Text>
              <Text className="text-muted-foreground">{item.email}</Text>
              <Text className="text-muted-foreground">
                {userRoles.find((role) => role.value === item.role)?.label}
              </Text>
              <Badge
                variant={statusVariants[getUserStatus(item)]}
                className="self-start"
              >
                <BadgeText numberOfLines={1} className="shrink-0">
                  {(
                    userStatuses.find(
                      (status) => status.value === getUserStatus(item),
                    )?.label ?? ''
                  ).toLocaleUpperCase('ru-RU')}
                </BadgeText>
              </Badge>
              <Text className="text-muted-foreground">
                {item.accessExpiresAt
                  ? `Доступ до ${new Date(item.accessExpiresAt).toLocaleString('ru-RU')}`
                  : 'Без ограничения срока'}
              </Text>
              <HStack space="sm" className="justify-end">
                <IconButton
                  size="icon"
                  variant="ghost"
                  className="min-h-12 min-w-12"
                  accessibilityLabel={`Редактировать пользователя ${item.name}`}
                  isDisabled={mutation.isPending}
                  onPress={() =>
                    router.push({
                      pathname: '/admin/users/[id]/edit',
                      params: { id: item.id },
                    })
                  }
                >
                  <ButtonIcon as={Pencil} />
                </IconButton>
                {item.id !== owner.id ? (
                  <>
                    <IconButton
                      size="icon"
                      variant="ghost"
                      className="min-h-12 min-w-12"
                      accessibilityLabel={`${item.isActive ? 'Заблокировать' : 'Разблокировать'} пользователя ${item.name}`}
                      isDisabled={mutation.isPending}
                      onPress={() => {
                        mutation.reset()
                        setAction({
                          user: item,
                          type: item.isActive ? 'block' : 'unblock',
                        })
                      }}
                    >
                      <ButtonIcon as={item.isActive ? Lock : LockOpen} />
                    </IconButton>
                    <IconButton
                      size="icon"
                      variant="ghost"
                      className="min-h-12 min-w-12"
                      accessibilityLabel={`Удалить навсегда пользователя ${item.name}`}
                      isDisabled={mutation.isPending}
                      onPress={() => {
                        mutation.reset()
                        setAction({ user: item, type: 'delete' })
                      }}
                    >
                      <ButtonIcon
                        as={Trash2}
                        className="text-destructive-text"
                      />
                    </IconButton>
                  </>
                ) : null}
              </HStack>
            </VStack>
          </Card>
        )}
      />
      <ConfirmDialog
        isOpen={Boolean(action)}
        title={
          action?.type === 'delete'
            ? 'Удалить пользователя навсегда?'
            : action?.type === 'block'
              ? 'Заблокировать пользователя?'
              : 'Разблокировать пользователя?'
        }
        description={[
          action?.user.email,
          action?.type === 'delete'
            ? 'Все его рецептуры и группы будут удалены без возможности восстановления.'
            : '',
          mutation.error ? message(mutation.error) : '',
        ]
          .filter(Boolean)
          .join('\n')}
        isDestructive={action?.type !== 'unblock'}
        confirmLabel={
          action?.type === 'delete' ? 'Удалить навсегда' : 'Подтвердить'
        }
        isLoading={mutation.isPending}
        onConfirm={() => mutation.mutate()}
        onClose={() => {
          if (!mutation.isPending) setAction(null)
        }}
      />
    </Screen>
  )
}
