import { ChevronDown, ChevronUp, Info } from 'lucide-react-native'
import { useState } from 'react'

import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Card } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

import type { DailyNormRow, DailyNorms } from '../types'
import { NormRow } from './norm-row'
import { NormsInfoDialog } from './norms-info-dialog'

/**
 * Макросостав: содержание в 100 г, норма в сутки и доля от нормы.
 * Все значения приходят с backend; клиент их не считает.
 */
function MacroCard({
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
            Макросостав
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
      {data.macro.map((row) => (
        <NormRow key={row.key} row={row} />
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

/** Микросостав: минералы; если данных нет ни у одного ингредиента — блока нет. */
function MicroCard({
  rows,
  subject,
}: {
  rows: DailyNormRow[]
  subject: string
}) {
  if (rows.length === 0) return null
  return (
    <Card>
      <Box className="gap-1">
        <Heading size={FontSize.md} className="text-card-foreground">
          Микросостав
        </Heading>
        <Text size={FontSize.sm} className="text-muted-foreground">
          Минеральный состав: содержание в 100 г {subject} и доля от усреднённой
          суточной нормы; для кобальта и ванадия — от адекватного уровня
          потребления
        </Text>
      </Box>
      {rows.map((row) => (
        <NormRow key={row.key} row={row} />
      ))}
      {rows.some((row) => row.partial) ? (
        <Text size={FontSize.sm} className="text-muted-foreground">
          * Значение известно не у всех ингредиентов, сумма неполная.
        </Text>
      ) : null}
    </Card>
  )
}

/** Прочее: влага, зольность и т. п.; без норм, свёрнуто по умолчанию. */
export function OtherNormsCard({
  rows,
  subject,
}: {
  rows: DailyNormRow[]
  subject: string
}) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Прочее"
        onPress={() => setOpen((value) => !value)}
        className="min-h-12 flex-row items-center justify-between gap-3"
      >
        <Heading size={FontSize.md} className="text-card-foreground">
          Прочее
        </Heading>
        <Icon
          as={open ? ChevronUp : ChevronDown}
          size="lg"
          className="text-muted-foreground"
        />
      </Pressable>
      {open ? (
        <>
          <Text size={FontSize.sm} className="text-muted-foreground">
            Содержание в 100 г {subject}, норм нет
          </Text>
          {rows.map((row) => (
            <NormRow key={row.key} row={row} />
          ))}
        </>
      ) : null}
    </Card>
  )
}

/** Макро- и микросостав; «Прочее» выводится отдельно (`withOther`). */
export function DailyNormsCard({
  data,
  subject,
  withOther = true,
}: {
  data: DailyNorms
  subject: string
  withOther?: boolean
}) {
  return (
    <>
      <MacroCard data={data} subject={subject} />
      <MicroCard rows={data.micro} subject={subject} />
      {withOther ? (
        <OtherNormsCard rows={data.other} subject={subject} />
      ) : null}
    </>
  )
}
