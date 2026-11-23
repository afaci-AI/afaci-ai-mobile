/**
 * Правило суммы Xᵢ рецептуры: одно на всё приложение.
 *
 * Значения совпадают с backend
 * (`features/calculator/domain/formulas/constants.py`). Клиент не должен быть
 * строже сервера: иначе принятый сервером состав — в том числе округлённый
 * результат оптимизации — отвергается на экране. Знак сравнения тоже как в
 * backend, где ошибку даёт `abs(total - REQUIRED_SUM) > SUM_TOLERANCE`.
 */
export const REQUIRED_SUM = 100
export const SUM_TOLERANCE = 0.01

export function hasRequiredSum(sum: number): boolean {
  return Number.isFinite(sum) && Math.abs(sum - REQUIRED_SUM) <= SUM_TOLERANCE
}
