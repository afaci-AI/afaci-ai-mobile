import { memo } from 'react'
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
    key: 'protein' | 'fat' | 'carb'
    label: string
    value: number | null
    unit: string
  }[]
}

/** Gifted Charts requires string colors and numeric radii, rather than classes. */
export const MacroChart = memo(function MacroChart({
  values,
}: MacroChartProps) {
  const colors = getNavigatorColors(useColorScheme())
  const colorMap = {
    protein: colors.chart1,
    fat: colors.chart4,
    carb: colors.chart2,
  }
  const available = values.filter((item) => item.value !== null)
  const sameUnit =
    available.length > 0 &&
    available.every((item) => item.unit && item.unit === available[0].unit)
  const chartData = values
    .filter((item) => item.value !== null && item.value > 0)
    .map((item) => ({
      value: item.value ?? 0,
      color: colorMap[item.key],
    }))
  const complete = values.every((item) => item.value !== null)

  return (
    <Card>
      <Heading size="lg" className="text-foreground">
        Соотношение БЖУ
      </Heading>
      <Text size="sm" className="text-muted-foreground">
        На 100 г продукта
      </Text>
      {chartData.length > 0 && sameUnit ? (
        <Box
          className="items-center py-2"
          accessible
          accessibilityRole="image"
          accessibilityLabel={values
            .map(
              (item) =>
                `${item.label}: ${formatNumber(item.value)} ${item.unit}`,
            )
            .join(', ')}
        >
          <PieChart
            data={chartData}
            donut
            radius={88}
            innerRadius={58}
            innerCircleColor={colors.card}
          />
        </Box>
      ) : (
        <Text size="sm" className="text-muted-foreground">
          Недостаточно значений в одной единице измерения для графика.
        </Text>
      )}
      <Box className="gap-3">
        {values.map((item) => (
          <Box key={item.key} className="flex-row items-center gap-3">
            <Box
              className={
                item.key === 'protein'
                  ? 'h-3 w-3 rounded-full bg-chart-1'
                  : item.key === 'fat'
                    ? 'h-3 w-3 rounded-full bg-chart-4'
                    : 'h-3 w-3 rounded-full bg-chart-2'
              }
            />
            <Text className="flex-1 text-foreground">{item.label}</Text>
            <Text className="text-foreground">
              {formatNumber(item.value)} {item.unit}
            </Text>
          </Box>
        ))}
      </Box>
      {!complete ? (
        <Text size="sm" className="text-muted-foreground">
          Состав неполный: показаны только доступные значения. Отсутствующее
          значение обозначено прочерком.
        </Text>
      ) : null}
    </Card>
  )
})
