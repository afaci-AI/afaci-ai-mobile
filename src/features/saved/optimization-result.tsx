import { formatNumber, formatSom } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Card } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

import type {
  MetricComparison,
  MetricKey,
  OptimizeRecipeResult,
} from './optimization-types'

const METRICS: { key: MetricKey; label: string; hint: string }[] = [
  { key: 'bc', label: 'БЦ', hint: 'больше — лучше' },
  { key: 'U', label: 'U', hint: 'больше — лучше' },
  { key: 'kras', label: 'КРАС', hint: 'меньше — лучше' },
  { key: 'G', label: 'G', hint: 'меньше — лучше' },
]

const DIRECTION: Record<MetricComparison['direction'], string> = {
  improved: 'лучше',
  worsened: 'хуже',
  unchanged: 'без изменений',
}

const DIRECTION_CLASS: Record<MetricComparison['direction'], string> = {
  improved: 'text-success-foreground',
  worsened: 'text-destructive-text',
  unchanged: 'text-muted-foreground',
}

function MetricRow({
  label,
  hint,
  value,
}: {
  label: string
  hint: string
  value: MetricComparison
}) {
  return (
    <Box className="gap-1 border-b border-border py-2">
      <Box className="flex-row items-baseline justify-between gap-3">
        <Text bold className="text-foreground">
          {label}
        </Text>
        <Text size={FontSize.sm} className={DIRECTION_CLASS[value.direction]}>
          {DIRECTION[value.direction]}
        </Text>
      </Box>
      <Text size={FontSize.sm} className="text-muted-foreground">
        {formatNumber(value.before, 3)} → {formatNumber(value.after, 3)} ·{' '}
        {hint}
      </Text>
    </Box>
  )
}

function CostCard({ result }: { result: OptimizeRecipeResult }) {
  if (result.mode !== 'cost') return null
  const savings = result.savings_per_kg
  return (
    <Card>
      <VStack space="xs">
        <Text bold className="text-foreground">
          Стоимость, сом/кг
        </Text>
        <Text className="text-foreground">
          {formatSom(result.baseline_cost_per_kg)} →{' '}
          {formatSom(result.total_cost_per_kg)}
        </Text>
        <Text size={FontSize.sm} className="text-muted-foreground">
          {savings !== null && savings < 0 ? 'Удорожание' : 'Экономия'}:{' '}
          {formatSom(savings === null ? null : Math.abs(savings))}
          {result.savings_percent !== null
            ? ` (${formatNumber(Math.abs(result.savings_percent), 1)} %)`
            : ''}
        </Text>
      </VStack>
    </Card>
  )
}

/** Итог оптимизации: статус, показатели до/после, стоимость и состав. */
export function OptimizationResult({
  result,
  names,
}: {
  result: OptimizeRecipeResult
  names: Record<string, string>
}) {
  const achieved = result.status === 'goal_achieved'
  const before = new Map(
    result.baseline_items.map((item) => [item.product_id, item.amount_g]),
  )
  return (
    <VStack space="md">
      <Card>
        <Text
          bold
          className={achieved ? 'text-foreground' : 'text-destructive-text'}
        >
          {result.message}
        </Text>
      </Card>
      <Card>
        <Text bold className="text-foreground">
          Показатели качества белка
        </Text>
        {METRICS.map((metric) => (
          <MetricRow
            key={metric.key}
            label={metric.label}
            hint={metric.hint}
            value={result.comparison[metric.key]}
          />
        ))}
      </Card>
      <CostCard result={result} />
      <Card>
        <Text bold className="text-foreground">
          Состав на 100 г
        </Text>
        {result.optimal_items.map((item) => (
          <Box
            key={item.product_id}
            className="flex-row items-baseline justify-between gap-3 border-b border-border py-2"
          >
            <Text className="flex-1 text-foreground">
              {names[item.product_id] ?? 'Ингредиент'}
            </Text>
            <Text size={FontSize.sm} className="shrink-0 text-muted-foreground">
              {formatNumber(before.get(item.product_id), 2)} →{' '}
              {formatNumber(item.amount_g, 2)} г
            </Text>
          </Box>
        ))}
      </Card>
    </VStack>
  )
}
