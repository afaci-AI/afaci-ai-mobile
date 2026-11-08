import type { DailyNorms } from '@/modules/norms/types'

/** Wire shapes verified against calculator.py, saved.py and compute_report. */
export interface CalculatorRow {
  key: string
  product_id: string
  product_name: string
  amount: string
  price: string
}

export interface CalcItem {
  product_id: string
  amount_g: number
}

export interface CalcRequest {
  reference_protein_id: string
  items: CalcItem[]
}

export interface ReferenceProteinValue {
  amino_acid: string
  value: number | null
}

export interface ReferenceSource {
  title: string
  authors?: string | null
  year?: number | null
  location?: string | null
  url?: string | null
  pdf_url?: string | null
}

export interface ReferenceProtein {
  id: string
  name: string
  year?: number | null
  description?: string | null
  is_default?: boolean
  values: ReferenceProteinValue[]
  source?: ReferenceSource | null
}

export interface AminoAcidResult {
  name: string
  m_j: number | null
  reference: number | null
  score: number | null
  utility: number | null
  is_min: boolean
  is_limiting: boolean
}

export interface ComputeRecipeItem extends CalcItem {
  name: string
  region?: string | null
  subcategory?: string | null
}

export interface VerdictDeficit {
  name: string
  score: number
  m_j: number
  reference: number
  deficit: number
}

export interface VerdictSource {
  title: string
  authors?: string | null
  year?: number | null
  location?: string | null
  url?: string | null
}

export interface VerdictIndicator {
  code: string
  title: string
  value: number
  unit?: string | null
  text: string
}

export interface ComputeVerdict {
  /**
   * complete — все скоры ≥ 100 %; incomplete — есть НАК ниже эталона;
   * unconfirmed — скоры не ниже эталона, но данных по НАК у части белка нет.
   */
  level: 'complete' | 'incomplete' | 'unconfirmed'
  headline: string
  points: string[]
  reference?: {
    name: string
    year?: number | null
    source?: VerdictSource | null
  }
  /** Правило сравнения и его происхождение — текст от backend. */
  criterion?: string
  limitations?: string[]
  explanation?: VerdictIndicator[]
  deficits?: VerdictDeficit[]
  /** Пометка «Экспериментальная функция» приходит от backend. */
  experimental_note?: string
}

export interface ComputeResult {
  recipe: ComputeRecipeItem[]
  sum_g: number
  reference: Omit<ReferenceProtein, 'is_default'>
  macro: {
    protein: number | null
    fat: number | null
    carb: number | null
    fiber: number | null
    protein_fat_ratio: number | null
  }
  energy_kcal: number | null
  amino_acids: AminoAcidResult[]
  c_min: { name: string; score: number | null } | null
  limiting: string[]
  limiting_count: number
  quality: {
    bc: number | null
    kras: number | null
    U: number | null
    G: number | null
  }
  amino_contributors?: string[]
  warnings?: string[]
  verdict?: ComputeVerdict | null
  /** Суточные нормы и доля от нормы для 100 г рецептуры; считаются на backend. */
  daily_norms?: DailyNorms | null
}

export interface CandidateIn {
  product_id: string
  price_per_kg: number
  min_amount_g?: number
  max_amount_g?: number
}

export interface OptConstraints {
  bc_min?: number
  kras_max?: number
}

export interface OptimizeCostRequest {
  reference_protein_id: string
  candidates: CandidateIn[]
  constraints?: OptConstraints
}

export interface OptimizeResult {
  total_cost_per_100g: number
  optimal_items: (CalcItem & { price_per_kg: number })[]
  report: ComputeResult
}

export interface ExampleRecipe {
  id: string
  name: string
  description?: string | null
  sample_type?: string | null
  items: ComputeRecipeItem[]
}

export interface RecipeGroup {
  id: string
  name: string
  created_at?: string | null
  recipe_count: number
}

export type SavedGroup = RecipeGroup

export interface RecipeMetrics {
  bc: number | null
  kras: number | null
  U: number | null
  G: number | null
  energy_kcal: number | null
  c_min_name: string | null
  c_min_score: number | null
}

export interface SavedRecipe {
  id: string
  name: string
  group_id: string | null
  reference_protein_id: string
  created_at: string | null
  updated_at: string | null
  metrics: RecipeMetrics
}

export interface SavedItem extends CalcItem {
  product_name?: string | null
  sort_order?: number
  price_per_kg?: number | null
}

export interface SavedRecipeDetail extends SavedRecipe {
  items: SavedItem[]
}

export interface SaveRecipeBody {
  name: string
  group_id?: string | null
  new_group_name?: string | null
  reference_protein_id: string
  items: SavedItem[]
  draft?: boolean
}

export type UpdateRecipeBody = Partial<Omit<SaveRecipeBody, 'new_group_name'>>
export type SavedRecipeCreate = SaveRecipeBody
export type SavedRecipeUpdate = UpdateRecipeBody
