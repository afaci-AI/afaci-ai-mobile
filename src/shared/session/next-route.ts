import type { Href } from 'expo-router'

/** Куда попадает пользователь сразу после входа, если `next` не задан. */
export const DEFAULT_AUTHENTICATED_ROUTE: Href = '/calculator'

/** Публичные разделы доступны без сессии, включая будущие карточки базы. */
export function isProtectedRoute(pathname: string): boolean {
  return ['/calculator', '/saved', '/profile', '/admin'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

/** Белый список маршрутов для параметра `next` — защита от открытого редиректа. */
const ALLOWED_NEXT_ROUTES: Href[] = [
  '/',
  '/calculator',
  '/database',
  '/saved',
  '/profile',
  '/admin',
]

export function resolveNextRoute(value: string | string[] | undefined): Href {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate) return DEFAULT_AUTHENTICATED_ROUTE

  return (
    ALLOWED_NEXT_ROUTES.find((href) => href === candidate) ??
    DEFAULT_AUTHENTICATED_ROUTE
  )
}
