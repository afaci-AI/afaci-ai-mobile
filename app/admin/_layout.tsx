import { Stack } from 'expo-router'

import { useSession } from '@/shared/session/store'

export default function AdminLayout() {
  const user = useSession((state) => state.user)

  // Гостя уводит AuthRedirect; пока пользователя нет, не рендерим содержимое.
  if (!user) {
    return null
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
