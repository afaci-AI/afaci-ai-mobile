import {
  useGlobalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from 'expo-router'
import { useEffect } from 'react'

import { isProtectedRoute, resolveNextRoute } from './next-route'
import { useSession } from './store'

/**
 * Единая точка редиректов: гость не остаётся на защищённых экранах,
 * авторизованный не остаётся на экране входа и уходит на `next` из ссылки.
 */
export const CHANGE_PASSWORD_ROUTE = '/change-password'

export function AuthRedirect() {
  const status = useSession((state) => state.status)
  const mustChangePassword = useSession(
    (state) => state.user?.mustChangePassword ?? false,
  )
  const segments = useSegments()
  const pathname = usePathname()
  const params = useGlobalSearchParams<{ next?: string }>()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading' || status === 'error') return

    const isAuthRoute = segments[0] === '(auth)'

    if (status === 'guest' && isProtectedRoute(pathname)) {
      router.replace({
        pathname: '/login',
        params: { next: String(resolveNextRoute(pathname)) },
      })
      return
    }

    // Временный пароль: до смены доступен только экран смены пароля.
    if (status === 'authenticated' && mustChangePassword) {
      if (pathname !== CHANGE_PASSWORD_ROUTE)
        router.replace(CHANGE_PASSWORD_ROUTE)
      return
    }

    if (status === 'authenticated' && isAuthRoute) {
      router.replace(resolveNextRoute(params.next))
    }
  }, [status, mustChangePassword, segments, pathname, params.next, router])

  return null
}
