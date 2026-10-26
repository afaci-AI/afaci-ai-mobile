import { request } from '@/shared/api/client'
import type { Product } from '@/modules/catalog/api'

import type {
  CalcRequest,
  ComputeResult,
  ExampleRecipe,
  OptimizeCostRequest,
  OptimizeResult,
  RecipeGroup,
  SavedRecipe,
  SavedRecipeDetail,
  SaveRecipeBody,
  UpdateRecipeBody,
  ReferenceProtein,
} from './types'

const examples = () => request<ExampleRecipe[]>('/calculator/recipes')

export const calculatorApi = {
  referenceProteins: () =>
    request<ReferenceProtein[]>('/calculator/reference-proteins'),
  examples,
  recipes: examples,
  compute: (body: CalcRequest) =>
    request<ComputeResult>('/calculator/compute', { method: 'POST', body }),
  optimizeCost: (body: OptimizeCostRequest) =>
    request<OptimizeResult>('/calculator/optimize-cost', {
      method: 'POST',
      body,
    }),
  groups: () => request<RecipeGroup[]>('/saved/groups'),
  createGroup: (name: string) =>
    request<RecipeGroup>('/saved/groups', { method: 'POST', body: { name } }),
  savedRecipes: () => request<SavedRecipe[]>('/saved/recipes'),
  recipe: (id: string) =>
    request<SavedRecipeDetail>(`/saved/recipes/${encodeURIComponent(id)}`),
  saveRecipe: (body: SaveRecipeBody) =>
    request<SavedRecipe>('/saved/recipes', { method: 'POST', body }),
  updateRecipe: (id: string, body: UpdateRecipeBody) =>
    request<SavedRecipe>(`/saved/recipes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body,
    }),
  product: (id: string) =>
    request<Product>(`/products/${encodeURIComponent(id)}`),
}
