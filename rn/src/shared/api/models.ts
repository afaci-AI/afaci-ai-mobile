export type UserRole = 'admin' | 'editor' | 'viewer'

export type UserStatus = 'active' | 'blocked' | 'expired' | 'unlimited'

/** Пользователь в том виде, в котором его отдаёт backend (`user_public`). */
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  accessExpiresAt?: string | null
  mustChangePassword?: boolean
  status?: UserStatus
  createdAt: string | null
  lastLoginAt?: string | null
}

/** `POST /api/v1/auth/login` возвращает словарь, а не Pydantic-модель. */
export interface LoginResponse {
  access_token: string
  user: User
}

export function normalizeRole(value: unknown): UserRole {
  return value === 'admin' || value === 'editor' ? value : 'viewer'
}

export function normalizeUser(raw: Partial<User> | null | undefined): User {
  return {
    id: String(raw?.id ?? ''),
    email: raw?.email ?? '',
    name: raw?.name ?? '',
    role: normalizeRole(raw?.role),
    isActive: raw?.isActive ?? true,
    accessExpiresAt: raw?.accessExpiresAt ?? null,
    mustChangePassword: raw?.mustChangePassword ?? false,
    status: raw?.status,
    createdAt: raw?.createdAt ?? null,
    lastLoginAt: raw?.lastLoginAt ?? null,
  }
}
