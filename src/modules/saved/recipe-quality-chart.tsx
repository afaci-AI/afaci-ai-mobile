import type { SavedRecipe } from '@/modules/calculator/types'
import { formatNumber } from '@/shared/lib/format'
import { FontSize } from '@/shared/theme/font-sizes'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Card } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

interface MetricDefinition {
  key: 'bc' | 'kras' | 'U' | 'G'
  title: string
  unit: string
  digits: number
  baseMaximum?: number
  colorClass: string
}

const metrics: MetricDefinition[] = [
  {
    key: 'bc',
    title: 'БЦ — биологическая ценность',
    unit: '%',
    digits: 2,
    baseMaximum: 100,
    colorClass: 'bg-chart-1',
  },
  {
    key: 'kras',
    title: 'КРАС — различия аминокислотного скора',
    unit: '%',
    digits: 2,
    baseMaximum: 100,
    colorClass: 'bg-chart-2',
  },
  {
    key: 'U',
    title: 'U — коэффициент утилитарности',
    unit: '',
    digits: 4,
    baseMaximum: 1,
    colorClass: 'bg-chart-3',
  },
  {
    key: 'G',
    title: 'G — сопоставимая избыточность',
    unit: 'г/100 г белка',
    digits: 4,
    colorClass: 'bg-chart-4',
  },
]

function isAvailable(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function formatChartNumber(value: number, digits: number) {
  // Avoid overflow in the shared formatter's rounding step for extreme finite data.
  if (!Number.isFinite(value * 10 ** digits)) {
    return String(value).replace('.', ',').replace(/^-/, '−')
  }
  return formatNumber(value, digits)
}

/** Plot-axis rounding only; this is not a quality threshold or metric calculation. */
function automaticMaximum(value: number) {
  const magnitude = Math.abs(value)
  if (magnitude === 0) return 1
  const rounded = 10 ** Math.ceil(Math.log10(magnitude))
  return Number.isFinite(rounded) && rounded > 0 ? rounded : magnitude
}

function MetricBar({
  metric,
  value,
}: {
  metric: MetricDefinition
  value: number | null
}) {
  if (!isAvailable(value)) {
    return (
      <VStack
        space="xs"
        accessible
        accessibilityLabel={`${metric.title}. Нет данных`}
      >
        <Text size={FontSize.sm} className="text-foreground">
          {metric.title}
        </Text>
        <Text size={FontSize.sm} className="text-muted-foreground">
          Нет данных
        </Text>
      </VStack>
    )
  }

  // Plot coordinates only: server metrics are never recalculated or clamped.
  const automatic = metric.baseMaximum === undefined
  const automaticLimit = automatic ? automaticMaximum(value) : 0
  const minimum = automatic && value < 0 ? -automaticLimit : Math.min(0, value)
  const maximum = automatic
    ? value < 0
      ? 0
      : automaticLimit
    : Math.max(metric.baseMaximum ?? 1, value)
  const range = maximum - minimum
  const zero = ((0 - minimum) / range) * 100
  const position = ((value - minimum) / range) * 100
  const formattedValue = `${formatChartNumber(value, metric.digits)}${metric.unit ? ` ${metric.unit}` : ''}`
  const scale = `${formatChartNumber(minimum, metric.digits)} — ${formatChartNumber(maximum, metric.digits)}${metric.unit ? ` ${metric.unit}` : ''}`

  return (
    <VStack
      space="sm"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${metric.title}: ${formattedValue}. Шкала ${scale}.${metric.baseMaximum === undefined ? ' Автоматическая шкала, не норматив.' : ''}`}
    >
      <Text size={FontSize.sm} className="text-foreground">
        {metric.title}
      </Text>
      <Text bold className="text-foreground">
        {formattedValue}
      </Text>
      <Box
        className="relative h-3 overflow-hidden rounded-full bg-muted"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Box
          className={`absolute top-0 bottom-0 ${metric.colorClass}`}
          // Percentage positions depend on this metric's displayed axis.
          style={{
            left: `${Math.min(zero, position)}%`,
            width: `${Math.abs(position - zero)}%`,
          }}
        />
        {minimum < 0 ? (
          <Box
            className="absolute top-0 bottom-0 w-px bg-foreground"
            // Show zero explicitly when the server supplies a negative value.
            style={{ left: `${zero}%` }}
          />
        ) : null}
      </Box>
      <Box className="flex-row justify-between gap-3">
        <Text size={FontSize.xs} className="text-muted-foreground">
          {formatChartNumber(minimum, metric.digits)}
        </Text>
        <Text size={FontSize.xs} className="shrink text-muted-foreground">
          {formatChartNumber(maximum, metric.digits)}
          {metric.unit ? ` ${metric.unit}` : ''}
        </Text>
      </Box>
      {metric.baseMaximum === undefined ? (
        <Text size={FontSize.xs} className="text-muted-foreground">
          Автоматическая шкала, не норматив.
        </Text>
      ) : null}
    </VStack>
  )
}

export function RecipeQualityChart({ recipe }: { recipe: SavedRecipe }) {
  const hasData = metrics.some((metric) =>
    isAvailable(recipe.metrics[metric.key]),
  )

  return (
    <Card>
      <Heading size={FontSize.md} className="text-card-foreground">
        Показатели качества белка
      </Heading>
      {hasData ? (
        <>
          <Text size={FontSize.sm} className="text-muted-foreground">
            У каждого показателя своя шкала. Длины полос не сравниваются между
            собой.
          </Text>
          <VStack space="xl">
            {metrics.map((metric) => (
              <MetricBar
                key={metric.key}
                metric={metric}
                value={recipe.metrics[metric.key]}
              />
            ))}
          </VStack>
        </>
      ) : (
        <Text size={FontSize.sm} className="text-muted-foreground">
          Нет данных для диаграммы. Сохраните рецептуру с рассчитанными
          показателями.
        </Text>
      )}
    </Card>
  )
}
