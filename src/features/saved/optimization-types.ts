import type { ComputeResult } from '@/features/calculator'

export type OptimizationMode = 'basic' | 'cost'

export interface OptimizeRecipeItem {
  product_id: string
  amount_g: number
  price_per_kg?: number | null
  min_amount_g?: number
  max_amount_g?: number
}

export interface OptimizeRecipeRequest {
  mode: OptimizationMode
  reference_protein_id: string
  items: OptimizeRecipeItem[]
}

export type MetricKey = 'bc' | 'U' | 'kras' | 'G'

export interface MetricComparison {
  before: number
  after: number
  delta: number
  direction: 'improved' | 'worsened' | 'unchanged'
}

export interface MetricViolation {
  metric: 'bc' | 'U' | 'G'
  threshold: number
  actual: number
  amount: number
  relative: number
}

/** Ответ `/calculator/optimize-recipe`; всё посчитано на backend. */
export interface OptimizeRecipeResult {
  mode: OptimizationMode
  status: 'goal_achieved' | 'goal_not_achieved'
  message: string
  optimal_items: { product_id: string; amount_g: number }[]
  baseline_items: { product_id: string; amount_g: number }[]
  original_report: ComputeResult
  report: ComputeResult
  comparison: Record<MetricKey, MetricComparison>
  violations: MetricViolation[]
  baseline_cost_per_kg: number | null
  total_cost_per_kg: number | null
  savings_per_kg: number | null
  savings_percent: number | null
}
