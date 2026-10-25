import type { UserRole } from '@/shared/api/models'

export type Permission =
  | 'canEditProducts'
  | 'canManageDictionaries'
  | 'canEditDictionaries'
  | 'canManageUsers'

/** Права ролей — копия `afaci-frontend/lib/types.ts`, чтобы UI совпадал с вебом. */
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'canEditProducts',
    'canManageDictionaries',
    'canEditDictionaries',
    'canManageUsers',
  ],
  editor: ['canEditProducts', 'canManageDictionaries', 'canEditDictionaries'],
  viewer: [],
}

export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false
  return rolePermissions[role]?.includes(permission) ?? false
}
