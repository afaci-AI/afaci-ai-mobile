import { calculatorApi } from '@/features/calculator'
import type { RecipeGroup } from '@/features/calculator'
import { request } from '@/shared/api/client'

import type {
  OptimizeRecipeRequest,
  OptimizeRecipeResult,
} from './optimization-types'

export const savedApi = {
  ...calculatorApi,
  renameGroup: (id: string, name: string) =>
    request<RecipeGroup>(`/saved/groups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { name },
    }),
  deleteGroup: (id: string) =>
    request(`/saved/groups/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  optimizeRecipe: (body: OptimizeRecipeRequest) =>
    request<OptimizeRecipeResult>('/calculator/optimize-recipe', {
      method: 'POST',
      body,
    }),
  deleteRecipe: (id: string) =>
    request(`/saved/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
