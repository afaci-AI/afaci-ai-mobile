import { Info } from 'lucide-react-native'
import { useState } from 'react'

import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Card } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

import type { DailyNorms } from '../types'
import { NormsInfoDialog } from './norms-info-dialog'

/**
 * Суточные нормы: содержание в 100 г, норма в сутки и доля от нормы.
 * Все значения приходят с backend; клиент их не считает.
 */
export function DailyNormsCard({
  data,
  subject,
}: {
  data: DailyNorms
  /** Что описывает блок: «продукта» или «рецептуры». */
  subject: string
}) {
  const [infoOpen, setInfoOpen] = useState(false)
  return (
    <Card>
      <Box className="flex-row items-start gap-2">
        <Box className="min-w-0 flex-1 gap-1">
          <Heading size={FontSize.md} className="text-card-foreground">
            Суточные нормы
          </Heading>
          <Text size={FontSize.sm} className="text-muted-foreground">
            В 100 г {subject} и доля от усреднённой суточной нормы взрослого
            человека
          </Text>
        </Box>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Откуда взяты суточные нормы"
          onPress={() => setInfoOpen(true)}
          className="h-12 w-12 shrink-0 items-center justify-center rounded-md data-[active=true]:bg-muted"
        >
          <Icon as={Info} size="lg" className="text-muted-foreground" />
        </Pressable>
      </Box>
      {data.norms.map((row) => (
        <Box
          key={row.key}
          className="gap-1 border-b border-border py-2"
          accessible
          accessibilityLabel={`${row.name}: ${
            row.amount === null
              ? 'нет данных'
              : `${formatNumber(row.amount, row.key === 'energy' ? 0 : 1)} ${row.unit}`
          }, норма ${formatNumber(row.norm, 0)} ${row.unit}, доля от нормы ${
            row.percent === null
              ? 'неизвестна'
              : `${formatNumber(row.percent, 1)} процента`
          }`}
        >
          <Box className="flex-row items-baseline justify-between gap-3">
            <Text bold className="text-foreground">
              {row.name}
            </Text>
            <Text bold className="text-foreground">
              {row.percent === null ? '—' : `${formatNumber(row.percent, 1)} %`}
            </Text>
          </Box>
          <Text size={FontSize.sm} className="text-muted-foreground">
            {row.amount === null
              ? 'Нет данных'
              : `${formatNumber(row.amount, row.key === 'energy' ? 0 : 1)} ${row.unit}`}{' '}
            из {formatNumber(row.norm, 0)} {row.unit} в сутки
          </Text>
        </Box>
      ))}
      <Text size={FontSize.sm} className="text-muted-foreground">
        Норма усреднённая, а не индивидуальная: реальная потребность зависит от
        пола, возраста и активности. Источник и способ усреднения — по кнопке
        информации.
      </Text>
      <NormsInfoDialog
        open={infoOpen}
        data={data}
        onClose={() => setInfoOpen(false)}
      />
    </Card>
  )
}
