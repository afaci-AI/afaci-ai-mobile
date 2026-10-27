import type { CalculatorRow } from './types'

/** Decimal comma is accepted; malformed, infinite and negative values are not. */
export function parseNumberInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null
  const number = Number(normalized)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export function toInputValue(
  value: number | null | undefined,
  digits = 6,
): string {
  return value == null || !Number.isFinite(value)
    ? ''
    : String(Number(value.toFixed(digits)))
}

export function sumAmounts(rows: CalculatorRow[]): number {
  return rows.reduce((sum, row) => sum + (parseNumberInput(row.amount) ?? 0), 0)
}

/** Numerical epsilon only: the UI requires 100 g, not an acceptance band. */
export function hasRequiredSum(sum: number): boolean {
  return Number.isFinite(sum) && Math.abs(sum - 100) < 1e-8
}

/** Prices are per kilogram; amount is grams. Result is cost of this batch. */
export function totalCost(rows: CalculatorRow[]): number | null {
  if (!rows.length) return null
  let total = 0
  for (const row of rows) {
    const amount = parseNumberInput(row.amount)
    const price = parseNumberInput(row.price)
    if (amount == null || price == null) return null
    total += (amount / 1000) * price
  }
  return Number.isFinite(total) ? total : null
}
