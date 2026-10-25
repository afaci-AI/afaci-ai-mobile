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
export function AuthRedirect() {
  const status = useSession((state) => state.status)
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

    if (status === 'authenticated' && isAuthRoute) {
      router.replace(resolveNextRoute(params.next))
    }
  }, [status, segments, pathname, params.next, router])

  return null
}
