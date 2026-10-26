import { calculatorApi } from '@/modules/calculator/api'
import type { RecipeGroup } from '@/modules/calculator/types'
import { request } from '@/shared/api/client'

export const savedApi = {
  ...calculatorApi,
  renameGroup: (id: string, name: string) =>
    request<RecipeGroup>(`/saved/groups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { name },
    }),
  deleteGroup: (id: string) =>
    request(`/saved/groups/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  deleteRecipe: (id: string) =>
    request(`/saved/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
