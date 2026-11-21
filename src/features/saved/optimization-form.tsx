import type { SavedRecipeDetail } from '@/features/calculator'
import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Card, Chip, Input } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

import type {
  OptimizationMode,
  OptimizeRecipeRequest,
} from './optimization-types'

export interface OptimizationRow {
  product_id: string
  name: string
  amount_g: number
  price: string
  min: string
  max: string
}

export const MODES: { value: OptimizationMode; label: string; hint: string }[] =
  [
    {
      value: 'basic',
      label: 'По качеству белка',
      hint: 'Максимальная БЦ при U не ниже и G не выше, чем у исходной рецептуры.',
    },
    {
      value: 'cost',
      label: 'По цене',
      hint: 'Минимальная стоимость при БЦ, U и G не хуже исходных и белке не ниже исходного.',
    },
  ]

/** Десятичная запятая допускается; пустая строка — значение по умолчанию. */
function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

export function rowsFromRecipe(recipe: SavedRecipeDetail): OptimizationRow[] {
  return recipe.items.map((item) => ({
    product_id: item.product_id,
    name: item.product_name ?? 'Ингредиент',
    amount_g: item.amount_g,
    price:
      item.price_per_kg === null || item.price_per_kg === undefined
        ? ''
        : String(item.price_per_kg),
    min: '',
    max: '',
  }))
}

/** Тело запроса либо текст ошибки ввода; диапазоны по умолчанию 0–100 г. */
export function buildRequest(
  mode: OptimizationMode,
  referenceId: string,
  rows: OptimizationRow[],
): OptimizeRecipeRequest | string {
  const items = []
  for (const row of rows) {
    const min = row.min.trim() ? parseDecimal(row.min) : 0
    const max = row.max.trim() ? parseDecimal(row.max) : 100
    if (min === null || max === null || min > 100 || max > 100)
      return `${row.name}: диапазон — числа от 0 до 100 г.`
    if (min > max) return `${row.name}: минимум больше максимума.`
    const price = row.price.trim() ? parseDecimal(row.price) : null
    if (mode === 'cost' && price === null)
      return `${row.name}: укажите цену, сом/кг.`
    items.push({
      product_id: row.product_id,
      amount_g: row.amount_g,
      price_per_kg: mode === 'cost' ? price : null,
      min_amount_g: min,
      max_amount_g: max,
    })
  }
  return { mode, reference_protein_id: referenceId, items }
}

function RowEditor({
  row,
  mode,
  onChange,
}: {
  row: OptimizationRow
  mode: OptimizationMode
  onChange: (patch: Partial<OptimizationRow>) => void
}) {
  return (
    <Box className="gap-2 border-b border-border py-3">
      <Box className="flex-row items-baseline justify-between gap-3">
        <Text bold className="flex-1 text-foreground">
          {row.name}
        </Text>
        <Text size={FontSize.sm} className="text-muted-foreground">
          {formatNumber(row.amount_g, 2)} г
        </Text>
      </Box>
      <Box className="flex-row gap-2">
        <Box className="flex-1">
          <Input
            value={row.min}
            onChangeText={(min) => onChange({ min })}
            placeholder="мин 0"
            keyboardType="decimal-pad"
            accessibilityLabel={`${row.name}: минимум, г`}
          />
        </Box>
        <Box className="flex-1">
          <Input
            value={row.max}
            onChangeText={(max) => onChange({ max })}
            placeholder="макс 100"
            keyboardType="decimal-pad"
            accessibilityLabel={`${row.name}: максимум, г`}
          />
        </Box>
      </Box>
      {mode === 'cost' ? (
        <Input
          value={row.price}
          onChangeText={(price) => onChange({ price })}
          placeholder="Цена, сом/кг"
          keyboardType="decimal-pad"
          accessibilityLabel={`${row.name}: цена, сом/кг`}
          rightSlot={
            <Text size={FontSize.sm} className="text-muted-foreground">
              сом/кг
            </Text>
          }
        />
      ) : null}
    </Box>
  )
}

/** Режим, диапазоны долей ингредиентов и цены для ценового режима. */
export function OptimizationForm({
  mode,
  onModeChange,
  rows,
  onRowChange,
}: {
  mode: OptimizationMode
  onModeChange: (mode: OptimizationMode) => void
  rows: OptimizationRow[]
  onRowChange: (index: number, patch: Partial<OptimizationRow>) => void
}) {
  return (
    <VStack space="md">
      <Box className="flex-row flex-wrap gap-2">
        {MODES.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={mode === item.value}
            onPress={() => onModeChange(item.value)}
          />
        ))}
      </Box>
      <Text size={FontSize.sm} className="text-muted-foreground">
        {MODES.find((item) => item.value === mode)?.hint}
      </Text>
      <Card>
        <Text bold className="text-foreground">
          Ингредиенты
        </Text>
        <Text size={FontSize.sm} className="text-muted-foreground">
          Диапазон доли, г на 100 г. Пустое поле — от 0 до 100 г.
        </Text>
        {rows.map((row, index) => (
          <RowEditor
            key={row.product_id}
            row={row}
            mode={mode}
            onChange={(patch) => onRowChange(index, patch)}
          />
        ))}
      </Card>
    </VStack>
  )
}
