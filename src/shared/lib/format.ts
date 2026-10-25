const NBSP = '\u00A0'
const MINUS = '\u2212'

/**
 * Форматирование чисел в русской типографике без Intl: на части Android-устройств
 * Hermes приходит без данных локали, и `Intl.NumberFormat('ru-RU')` даёт
 * английский формат. Ручная реализация гарантирует пробел-разделитель разрядов
 * и запятую как десятичный разделитель.
 */
export function formatNumber(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }

  const factor = 10 ** digits
  const rounded = Math.round(value * factor) / factor
  const [integer, fraction] = Math.abs(rounded).toFixed(digits).split('.')

  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)
  const trimmedFraction = fraction?.replace(/0+$/, '')
  const formatted = trimmedFraction ? `${grouped},${trimmedFraction}` : grouped

  return rounded < 0 ? `${MINUS}${formatted}` : formatted
}

/** Целое число с разделителем разрядов. */
export function formatInteger(value: number | null | undefined): string {
  return formatNumber(value, 0)
}

/** Стоимость в сомах: «1 234,56 сом». */
export function formatSom(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  return `${formatNumber(value, digits)}${NBSP}сом`
}

export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—'
  }
  return `${formatNumber(value, digits)}%`
}

/**
 * Разбор пользовательского ввода: принимает «1 234,56», «1234.56», «1 234».
 * Возвращает null, если ввод не является числом.
 */
export function parseNumberInput(value: string): number | null {
  const normalized = value.replace(/[\s\u00A0]/g, '').replace(',', '.')
  if (!normalized) return null

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Дата в формате 31.12.2026. */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

/** Дата и время в формате 31.12.2026, 14:05. */
export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  const date = toDate(value)
  if (!date) return '—'

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${formatDate(date)}, ${hours}:${minutes}`
}
