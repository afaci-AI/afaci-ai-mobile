import { useState } from 'react'
import { Linking } from 'react-native'
import { Redirect, router } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/shared/session/store'
import { FlatList } from '@/shared/ui/flat-list'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
  useAppToast,
} from '@/shared/ui/kit'
import {
  apkUrl,
  deleteVersion,
  listVersions,
  setCurrentVersion,
  versionsKey,
  type AppVersion,
} from './versions-api'

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить действие.'
export function AdminVersionsScreen() {
  const user = useSession((s) => s.user)
  const client = useQueryClient()
  const toast = useAppToast()
  const [confirm, setConfirm] = useState<{
    version: AppVersion
    action: 'delete' | 'current'
  } | null>(null)
  const [linkError, setLinkError] = useState('')
  const versions = useQuery({
    queryKey: versionsKey,
    queryFn: listVersions,
    enabled: user?.role === 'admin',
  })
  const owner = user?.id
  const active = () =>
    useSession.getState().user?.id === owner &&
    useSession.getState().user?.role === 'admin'
  const action = useMutation({
    mutationFn: async () => {
      if (!active() || !confirm) throw new Error('Недостаточно прав.')
      if (confirm.action === 'delete') await deleteVersion(confirm.version.id)
      else await setCurrentVersion(confirm.version.id)
    },
    onSuccess: async () => {
      if (!active()) return
      await client.invalidateQueries({ queryKey: versionsKey })
      if (active()) {
        setConfirm(null)
        toast.success({ title: 'Версии обновлены' })
      }
    },
  })
  if (!user) return null
  if (user.role !== 'admin') return <Redirect href="/admin" />
  return (
    <Screen>
      <FlatList
        data={versions.error ? [] : (versions.data ?? [])}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
        refreshing={versions.isRefetching}
        onRefresh={() => void versions.refetch()}
        ListHeaderComponent={
          <VStack space="md">
            <Header
              title="Версии приложения"
              onBack={() =>
                router.canGoBack() ? router.back() : router.replace('/admin')
              }
            />
            <Button
              label="Создать версию"
              onPress={() => router.push('/admin/app-versions/new')}
            />
            {versions.error ? (
              <ErrorState
                message={message(versions.error)}
                onRetry={() => void versions.refetch()}
              />
            ) : null}
            {linkError ? (
              <Text accessibilityRole="alert" className="text-destructive-text">
                {linkError}
              </Text>
            ) : null}
          </VStack>
        }
        ListEmptyComponent={
          versions.isPending ? (
            <LoadingView fullscreen={false} />
          ) : !versions.error ? (
            <EmptyState title="Версий пока нет" />
          ) : undefined
        }
        renderItem={({ item }) => (
          <Card>
            <Text bold size="lg" className="text-foreground">
              {item.version} · код {item.versionCode}
            </Text>
            <Text className="text-muted-foreground">
              {item.isCurrent ? 'Текущая версия' : 'Архивная версия'} ·{' '}
              {new Date(item.publishedAt).toLocaleDateString('ru-RU')}
            </Text>
            {item.forceUpdate ? (
              <Text className="text-foreground">Обязательное обновление</Text>
            ) : null}
            {item.minSupportedVersionCode !== null ? (
              <Text className="text-muted-foreground">
                Минимальный код: {item.minSupportedVersionCode}
              </Text>
            ) : null}
            {item.changelog ? (
              <Text className="text-foreground">{item.changelog}</Text>
            ) : null}
            <Button
              label="Открыть APK"
              variant="outline"
              onPress={() => {
                setLinkError('')
                void Promise.resolve()
                  .then(() => Linking.openURL(apkUrl(item.apkUrl)))
                  .catch(() =>
                    setLinkError(
                      'Не удалось открыть ссылку APK. Проверьте доступность браузера и повторите.',
                    ),
                  )
              }}
            />
            <Button
              label="Редактировать"
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/admin/app-versions/[id]/edit',
                  params: { id: item.id },
                })
              }
            />
            {!item.isCurrent ? (
              <>
                <Button
                  label="Назначить текущей"
                  variant="outline"
                  onPress={() => {
                    action.reset()
                    setConfirm({ version: item, action: 'current' })
                  }}
                />
                <Button
                  label="Удалить"
                  variant="destructive"
                  onPress={() => {
                    action.reset()
                    setConfirm({ version: item, action: 'delete' })
                  }}
                />
              </>
            ) : null}
          </Card>
        )}
      />
      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={
          confirm?.action === 'delete'
            ? 'Удалить версию?'
            : 'Назначить текущей?'
        }
        description={[
          confirm?.version.version,
          confirm?.action === 'delete'
            ? 'Запись версии будет удалена безвозвратно.'
            : 'Эту версию увидят пользователи при проверке обновлений.',
          action.error ? message(action.error) : '',
        ]
          .filter(Boolean)
          .join('\n')}
        confirmLabel={confirm?.action === 'delete' ? 'Удалить' : 'Назначить'}
        isDestructive={confirm?.action === 'delete'}
        isLoading={action.isPending}
        onConfirm={() => action.mutate()}
        onClose={() => {
          if (!action.isPending) {
            setConfirm(null)
            action.reset()
          }
        }}
      />
    </Screen>
  )
}
