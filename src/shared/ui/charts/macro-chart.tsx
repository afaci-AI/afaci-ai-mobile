import { memo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'

import { formatNumber } from '@/shared/lib/format'
import { getNavigatorColors } from '@/shared/theme/navigator-colors'
import { Box } from '@/shared/ui/box'
import { Card } from '@/shared/ui/kit'
import { Heading } from '@/shared/ui/heading'
import { Text } from '@/shared/ui/text'

interface MacroChartProps {
  values: {
    key: 'protein' | 'fat' | 'carb' | 'fiber'
    label: string
    value: number | null
    unit: string
  }[]
  title?: string
  subtitle?: string
  donut?: boolean
  footer?: ReactNode
}

/** Gifted Charts requires string colors and numeric radii, rather than classes. */
export const MacroChart = memo(function MacroChart({
  values,
  title = 'Соотношение БЖУ',
  subtitle = 'На 100 г продукта',
  donut = true,
  footer,
}: MacroChartProps) {
  const colors = getNavigatorColors(useColorScheme())
  const colorMap = {
    protein: colors.chart1,
    fat: colors.chart4,
    carb: colors.chart2,
    fiber: colors.chart3,
  }
  const displayValues = values.map((item) => ({
    ...item,
    value:
      item.value !== null && Number.isFinite(item.value) && item.value >= 0
        ? item.value
        : null,
  }))
  const available = displayValues.filter(
    (item) =>
      item.value !== null && Number.isFinite(item.value) && item.value >= 0,
  )
  const sameUnit =
    available.length > 0 &&
    available.every((item) => item.unit && item.unit === available[0].unit)
  const chartData = displayValues
    .filter(
      (item) =>
        item.value !== null && Number.isFinite(item.value) && item.value > 0,
    )
    .map((item) => ({
      value: item.value ?? 0,
      color: colorMap[item.key],
    }))
  const complete = available.length === values.length

  return (
    <Card>
      <Heading size="lg" className="text-foreground">
        {title}
      </Heading>
      <Text size="sm" className="text-muted-foreground">
        {subtitle}
      </Text>
      {chartData.length > 0 && sameUnit ? (
        <Box
          className="items-center py-2"
          accessible
          accessibilityRole="image"
          accessibilityLabel={displayValues
            .map(
              (item) =>
                `${item.label}: ${formatNumber(item.value)} ${item.unit}`,
            )
            .join(', ')}
        >
          <PieChart
            data={chartData}
            donut={donut}
            radius={88}
            innerRadius={donut ? 58 : 0}
            innerCircleColor={colors.card}
          />
        </Box>
      ) : (
        <Text size="sm" className="text-muted-foreground">
          {complete && sameUnit && available.every((item) => item.value === 0)
            ? 'Все значения равны 0 — доли отсутствуют.'
            : 'Недостаточно значений в одной единице измерения для графика.'}
        </Text>
      )}
      <Box className="gap-3">
        {displayValues.map((item) => (
          <Box key={item.key} className="flex-row items-center gap-3">
            <Box
              className={
                item.key === 'protein'
                  ? 'h-3 w-3 rounded-full bg-chart-1'
                  : item.key === 'fat'
                    ? 'h-3 w-3 rounded-full bg-chart-4'
                    : item.key === 'carb'
                      ? 'h-3 w-3 rounded-full bg-chart-2'
                      : 'h-3 w-3 rounded-full bg-chart-3'
              }
            />
            <Text className="flex-1 shrink text-foreground">{item.label}</Text>
            <Text className="text-foreground">
              {formatNumber(item.value)} {item.unit}
            </Text>
          </Box>
        ))}
      </Box>
      {footer}
      {!complete ? (
        <Text size="sm" className="text-muted-foreground">
          Состав неполный: показаны только доступные значения. Отсутствующие или
          некорректные значения обозначены прочерком.
        </Text>
      ) : null}
    </Card>
  )
})
