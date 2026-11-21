import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

import type { DailyNormRow } from '../types'

/** Знаков после запятой: энергия — целые, малые значения — больше знаков. */
function digitsFor(row: DailyNormRow): number {
  if (row.key === 'energy') return 0
  const amount = Math.abs(row.amount ?? 0)
  if (amount > 0 && amount < 1) return 3
  return amount < 10 ? 2 : 1
}

function withUnit(value: string, unit: string | null): string {
  return unit ? `${value} ${unit}` : value
}

function amountText(row: DailyNormRow): string {
  if (row.amount === null) return 'Нет данных'
  const text = withUnit(formatNumber(row.amount, digitsFor(row)), row.unit)
  return row.partial ? `${text} *` : text
}

/** Строка блока: название, доля от нормы и «содержание из нормы». */
export function NormRow({ row }: { row: DailyNormRow }) {
  const norm =
    row.norm === null ? null : withUnit(formatNumber(row.norm, 0), row.unit)
  const percent =
    row.percent === null ? null : `${formatNumber(row.percent, 1)} %`
  return (
    <Box
      className="gap-1 border-b border-border py-2"
      accessible
      accessibilityLabel={`${row.name}: ${amountText(row)}${
        norm ? `, норма ${norm}` : ', нормы нет'
      }${percent ? `, доля от нормы ${percent}` : ''}${
        row.partial ? ', данные неполные' : ''
      }`}
    >
      <Box className="flex-row items-baseline justify-between gap-3">
        <Text bold className="text-foreground">
          {row.name}
        </Text>
        <Text bold className="text-foreground">
          {percent ?? (norm ? '—' : amountText(row))}
        </Text>
      </Box>
      {norm ? (
        <Text size={FontSize.sm} className="text-muted-foreground">
          {amountText(row)} из {norm} в сутки
        </Text>
      ) : null}
    </Box>
  )
}
