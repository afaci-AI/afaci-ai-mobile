import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { ChevronRight, LogOut, Shield } from 'lucide-react-native'
import { useState } from 'react'

import type { UserRole } from '@/shared/api/models'
import { formatDateTime } from '@/shared/lib/format'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Header,
  ScrollScreen,
  useAppToast,
} from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  editor: 'Редактор',
  viewer: 'Просмотр',
}

export default function ProfileScreen() {
  const router = useRouter()
  const user = useSession((state) => state.user)
  const status = useSession((state) => state.status)
  const logout = useSession((state) => state.logout)
  const toast = useAppToast()

  const [isLogoutOpen, setLogoutOpen] = useState(false)
  const [isLoggingOut, setLoggingOut] = useState(false)

  const appVersion = Constants.expoConfig?.version ?? '—'

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      router.replace('/login')
    } catch {
      toast.error({
        title: 'Не удалось удалить сохранённый вход',
        description: 'Повторите выход перед закрытием приложения.',
      })
    } finally {
      setLoggingOut(false)
      setLogoutOpen(false)
    }
  }

  if (status !== 'authenticated') return null

  return (
    <ScrollScreen>
      <Header title="Профиль" className="-mx-4 -mt-4 mb-2" />

      {user ? (
        <>
          <Card>
            <Box className="flex-row items-center gap-3">
              <Box className="h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Text bold className="text-foreground">
                  {user.name.slice(0, 1).toUpperCase()}
                </Text>
              </Box>
              <Box className="flex-1 gap-1">
                <Heading size={FontSize.md} className="text-card-foreground">
                  {user.name}
                </Heading>
                <Text size={FontSize.sm} className="text-muted-foreground">
                  {user.email}
                </Text>
              </Box>
              <Badge label={ROLE_LABELS[user.role]} variant="secondary" />
            </Box>

            <Box className="gap-2 border-t border-border pt-3">
              <Box className="flex-row justify-between gap-3">
                <Text size={FontSize.sm} className="text-muted-foreground">
                  Последний вход
                </Text>
                <Text size={FontSize.sm} className="text-card-foreground">
                  {formatDateTime(user.lastLoginAt)}
                </Text>
              </Box>
              <Box className="flex-row justify-between gap-3">
                <Text size={FontSize.sm} className="text-muted-foreground">
                  Версия приложения
                </Text>
                <Text size={FontSize.sm} className="text-card-foreground">
                  {appVersion}
                </Text>
              </Box>
            </Box>
          </Card>

          {hasPermission(user.role, 'canEditProducts') ? (
            <Card className="p-0">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/admin')}
                className="flex-row items-center gap-3 p-4 data-[active=true]:bg-muted"
              >
                <Icon as={Shield} className="text-foreground" />
                <Box className="flex-1">
                  <Text className="text-card-foreground">Админка</Text>
                  <Text size={FontSize.sm} className="text-muted-foreground">
                    {user.role === 'admin'
                      ? 'Продукты, словари, пользователи'
                      : 'Продукты и словари'}
                  </Text>
                </Box>
                <Icon as={ChevronRight} className="text-muted-foreground" />
              </Pressable>
            </Card>
          ) : null}

          <Button
            label="Выйти"
            variant="outline"
            icon={LogOut}
            onPress={() => setLogoutOpen(true)}
          />

          <ConfirmDialog
            isOpen={isLogoutOpen}
            title="Выйти из аккаунта?"
            description="Для доступа к рецептурам потребуется снова войти."
            confirmLabel="Выйти"
            isDestructive
            isLoading={isLoggingOut}
            onConfirm={handleLogout}
            onClose={() => setLogoutOpen(false)}
          />
        </>
      ) : (
        <Card>
          <Heading size={FontSize.md} className="text-card-foreground">
            Вы не вошли
          </Heading>
          <Text size={FontSize.sm} className="text-muted-foreground">
            Войдите, чтобы сохранять рецептуры и пользоваться админкой.
          </Text>
          <Button label="Войти" onPress={() => router.push('/login')} />
        </Card>
      )}
    </ScrollScreen>
  )
}
