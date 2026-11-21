import { create } from 'zustand'
import { useSession } from '@/shared/session/store'
import type { ComputeResult, RecipeMetrics } from './types'

/** Сохранённые метрики рецептуры, с которыми сверяется свежий расчёт. */
export interface RecipeCompare {
  name: string
  metrics: RecipeMetrics
}

export const useCalculatorReport = create<{
  ownerId: string | null
  result: ComputeResult | null
  compare: RecipeCompare | null
}>(() => ({ ownerId: null, result: null, compare: null }))
useSession.subscribe((next, previous) => {
  if (next.status !== 'authenticated' || next.user?.id !== previous.user?.id) {
    useCalculatorReport.setState({ ownerId: null, result: null, compare: null })
  }
})

/** Допуск — единица округления, с которой метрики сохраняются и показываются. */
const TOLERANCE = { bc: 0.1, kras: 0.1, U: 0.01, G: 0.01, energy_kcal: 0.5 }

/** Названия показателей, значения которых по текущим данным продуктов отличаются от сохранённых. */
export function metricDifferences(
  result: ComputeResult,
  saved: RecipeMetrics,
): string[] {
  const now = {
    bc: result.quality.bc,
    kras: result.quality.kras,
    U: result.quality.U,
    G: result.quality.G,
    energy_kcal: result.energy_kcal,
  }
  const labels = {
    bc: 'БЦ',
    kras: 'КРАС',
    U: 'U',
    G: 'G',
    energy_kcal: 'энергоценность',
  } as const
  return (Object.keys(labels) as (keyof typeof labels)[])
    .filter((key) => {
      const a = now[key]
      const b = saved[key]
      if (a == null || b == null) return false
      return Math.abs(a - b) > TOLERANCE[key] + 1e-9
    })
    .map((key) => labels[key])
}
