import { Redirect, Stack, usePathname } from 'expo-router'

import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'

export default function AdminLayout() {
  const user = useSession((state) => state.user)
  const pathname = usePathname()

  // Гостя уводит AuthRedirect; пока пользователя нет, не рендерим содержимое.
  if (!user) return null

  if (
    user.role !== 'admin' &&
    /^\/admin\/users(\/|$)/.test(pathname)
  ) {
    return <Redirect href="/admin" />
  }

  const canEdit = hasPermission(user.role, 'canEditProducts')
  // Viewer может открыть данные по прямой ссылке, но не формы изменения.
  if (!canEdit && /\/(new|edit)\/?$/.test(pathname)) {
    return <Redirect href="/admin/products" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
