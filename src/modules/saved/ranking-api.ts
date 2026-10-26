import { request } from '@/shared/api/client'

export interface RankedRecipe {
  recipe_id: string
  rank: number
  name: string
  group: string | null
  composite: number
  bc: number | null
  kras: number | null
  V: number | null
  G: number | null
}

export interface RankingResult {
  winner: string | null
  ranking: RankedRecipe[]
}

export const rankRecipes = (recipeIds: string[]) =>
  request<RankingResult>('/saved/ranking', {
    method: 'POST',
    body: { recipe_ids: recipeIds },
  })
