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

export interface ReferenceProtein {
  id: string
  name: string
  year?: number | null
  description?: string | null
  is_default?: boolean
  values: ReferenceProteinValue[]
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

export interface ComputeVerdict {
  level: 'good' | 'moderate' | 'poor'
  headline: string
  points: string[]
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
    V: number | null
    G: number | null
  }
  amino_contributors?: string[]
  warnings?: string[]
  verdict?: ComputeVerdict | null
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
  V: number | null
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
