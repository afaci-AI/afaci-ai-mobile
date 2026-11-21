import { useRef, useState } from 'react'
import { useSession } from '@/shared/session/store'
import { useCalculatorReport, type RecipeCompare } from './report-store'
import type { CalculatorRow, ComputeResult, SavedRecipeDetail } from './types'

export type { CalculatorRow } from './types'
let sequence = 0
export const emptyRow = (): CalculatorRow => ({
  key: String(++sequence),
  product_id: '',
  product_name: '',
  amount: '',
  price: '',
})
/** Сигнатура редактируемых данных рецептуры; равные сигнатуры — нет изменений. */
export function recipeSignature(
  rows: CalculatorRow[],
  referenceId: string,
  costEnabled: boolean,
): string {
  return JSON.stringify([
    referenceId,
    costEnabled,
    rows
      .filter((r) => r.product_id)
      .map((r) => [
        r.product_id,
        Number(r.amount.replace(',', '.')),
        costEnabled ? Number((r.price || '').replace(',', '.')) : null,
      ]),
  ])
}
export const rowKey = () => String(++sequence)

/** Every input change invalidates both displayed and in-flight reports. */
export function useCalculatorState() {
  const [rows, setRows] = useState<CalculatorRow[]>(() => [emptyRow()])
  const [referenceId, setReferenceId] = useState('')
  const [costEnabled, setCostEnabled] = useState(false)
  const [result, setLocalResult] = useState<ComputeResult | null>(null)
  const [editing, setEditing] = useState<Pick<
    SavedRecipeDetail,
    'id' | 'name' | 'group_id' | 'metrics'
  > | null>(null)
  /** Снимок сохранённого состава: по нему определяется «есть несохранённые изменения». */
  const [baseline, setBaseline] = useState<string | null>(null)
  const ownerId = useSession((state) => state.user?.id ?? null)
  const setResult = (
    value: ComputeResult | null,
    compare: RecipeCompare | null = null,
  ) => {
    setLocalResult(value)
    useCalculatorReport.setState({ ownerId, result: value, compare })
  }
  const revision = useRef(0)
  const invalidate = () => {
    revision.current++
    setResult(null)
  }
  return {
    rows,
    setRows,
    referenceId,
    setReferenceId,
    costEnabled,
    setCostEnabled,
    result,
    setResult,
    editing,
    setEditing,
    baseline,
    setBaseline,
    revision,
    invalidate,
    patchRow(key: string, patch: Partial<CalculatorRow>) {
      invalidate()
      setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
    },
    changeReference(id: string) {
      invalidate()
      setReferenceId(id)
    },
    changeRows(next: CalculatorRow[]) {
      invalidate()
      setRows(next)
    },
    changeCost(value: boolean) {
      invalidate()
      setCostEnabled(value)
    },
  }
}
