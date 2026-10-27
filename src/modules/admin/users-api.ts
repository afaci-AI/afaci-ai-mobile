import { request } from '@/shared/api/client'
import {
  normalizeUser,
  type User,
  type UserRole,
  type UserStatus,
} from '@/shared/api/models'
import { useSession } from '@/shared/session/store'

export const userRoles = [
  { value: 'admin', label: 'Администратор' },
  { value: 'editor', label: 'Редактор' },
  { value: 'viewer', label: 'Наблюдатель' },
]
export const userStatuses: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Активен' },
  { value: 'unlimited', label: 'Безлимитный' },
  { value: 'blocked', label: 'Заблокирован' },
  { value: 'expired', label: 'Доступ истёк' },
]
export function assertUserAdmin(owner?: string) {
  const user = useSession.getState().user
  if (user?.role !== 'admin' || (owner && user.id !== owner))
    throw new Error('Управление пользователями доступно только администратору.')
}
export function getUserStatus(user: User): UserStatus {
  if (!user.isActive) return 'blocked'
  if (!user.accessExpiresAt) return 'unlimited'
  return new Date(user.accessExpiresAt).getTime() <= Date.now()
    ? 'expired'
    : 'active'
}
export async function listUsers(search: string, role: string) {
  assertUserAdmin()
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (role) params.set('role', role)
  return (await request<User[]>(`/users?${params}`)).map(normalizeUser)
}
export async function getAdminUser(id: string) {
  assertUserAdmin()
  return normalizeUser(await request<User>(`/users/${encodeURIComponent(id)}`))
}
export interface UserInput {
  name: string
  role: UserRole
  access_expires_at: string | null
  access_expires_at_unlimited?: boolean
  email?: string
  password?: string
  must_change_password?: boolean
}
export async function saveUser(id: string | undefined, body: UserInput) {
  assertUserAdmin()
  if (id === useSession.getState().user?.id && body.role !== 'admin')
    throw new Error('Нельзя понизить роль собственной учётной записи.')
  return normalizeUser(
    await request<User>(id ? `/users/${encodeURIComponent(id)}` : '/users', {
      method: id ? 'PATCH' : 'POST',
      body,
    }),
  )
}
export async function changeUserState(
  user: User,
  action: 'block' | 'unblock' | 'delete',
) {
  assertUserAdmin()
  if (user.id === useSession.getState().user?.id)
    throw new Error('Это действие недоступно для собственной учётной записи.')
  const path = `/users/${encodeURIComponent(user.id)}`
  return request(action === 'delete' ? `${path}/permanent` : path, {
    method: action === 'unblock' ? 'PATCH' : 'DELETE',
    ...(action === 'unblock' ? { body: { is_active: true } } : {}),
  })
}
