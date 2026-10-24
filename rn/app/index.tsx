import { useState } from 'react'

import { Box } from '@/shared/ui/box'
import { Button, ButtonText } from '@/shared/ui/button'
import { Text } from '@/shared/ui/text'

const palette = [
  { className: 'bg-background', label: 'background' },
  { className: 'bg-card', label: 'card' },
  { className: 'bg-primary', label: 'primary' },
  { className: 'bg-secondary', label: 'secondary' },
  { className: 'bg-muted', label: 'muted' },
  { className: 'bg-destructive', label: 'destructive' },
  { className: 'bg-border', label: 'border' },
]

const charts = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
]

export default function SmokeScreen() {
  const [presses, setPresses] = useState(0)

  return (
    <Box className="flex-1 bg-background px-6 pt-16 pb-8">
      <Text size="3xl" bold className="text-foreground">
        AFACI
      </Text>
      <Text size="md" className="mt-2 text-muted-foreground">
        Проверка стека: Expo 58, NativeWind 5, gluestack-ui 5
      </Text>

      <Box className="mt-8 gap-4 rounded-xl border border-border bg-card p-4">
        <Text size="sm" bold className="text-card-foreground">
          Семантические токены
        </Text>

        <Box className="flex-row flex-wrap gap-3">
          {palette.map((token) => (
            <Box key={token.label} className="items-center gap-1">
              <Box
                className={`h-10 w-10 rounded-md border border-border ${token.className}`}
              />
              <Text size="2xs" className="text-muted-foreground">
                {token.label}
              </Text>
            </Box>
          ))}
        </Box>

        <Box className="flex-row gap-2">
          {charts.map((className) => (
            <Box
              key={className}
              className={`h-6 flex-1 rounded-sm ${className}`}
            />
          ))}
        </Box>

        <Text size="xs" className="text-muted-foreground">
          chart-1 … chart-5, радиус и границы — из общей дизайн-системы
        </Text>
      </Box>

      <Box className="mt-8 gap-3">
        <Button onPress={() => setPresses((value) => value + 1)}>
          <ButtonText>Проверить нажатие</ButtonText>
        </Button>
        <Text size="sm" className="text-muted-foreground">
          Нажатий: {presses}
        </Text>
      </Box>
    </Box>
  )
}
