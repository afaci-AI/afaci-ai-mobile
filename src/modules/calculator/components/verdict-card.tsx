import { useState } from 'react'
import { Linking } from 'react-native'

import { formatNumber as nf } from '@/shared/lib/format'
import { FontSize } from '@/shared/theme/font-sizes'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Badge, Button, Card } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'

import type { ComputeVerdict } from '../types'

const LEVEL_LABELS: Record<string, string> = {
  complete: 'Полноценный по эталону',
  incomplete: 'Неполноценный по эталону',
  unconfirmed: 'Не подтверждено: мало данных',
}

async function openUrl(url: string): Promise<void> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return
    await Linking.openURL(parsed.href)
  } catch {
    // Ссылка недоступна — текст источника остаётся на экране.
  }
}

export function VerdictCard({ verdict }: { verdict: ComputeVerdict }) {
  const [open, setOpen] = useState(false)
  const source = verdict.reference?.source
  const hasWhy = Boolean(
    verdict.criterion || verdict.explanation?.length || source,
  )

  return (
    <Card>
      <Heading size={FontSize.md} className="text-foreground">
        {verdict.headline}
      </Heading>
      {LEVEL_LABELS[verdict.level] ? (
        <Badge label={LEVEL_LABELS[verdict.level]} />
      ) : null}
      {verdict.experimental_note ? (
        <Text
          size={FontSize.sm}
          accessibilityRole="text"
          className="rounded-md border border-dashed border-border bg-muted p-2 text-muted-foreground"
        >
          {verdict.experimental_note}
        </Text>
      ) : null}
      {verdict.points.map((point, index) => (
        <Text key={index} className="text-foreground">
          {point}
        </Text>
      ))}
      {hasWhy ? (
        <Button
          label={open ? 'Скрыть объяснение' : 'Почему такой вывод'}
          variant="outline"
          onPress={() => setOpen((value) => !value)}
        />
      ) : null}
      {open ? (
        <Box className="gap-3">
          {verdict.criterion ? (
            <Box className="gap-1">
              <Text bold className="text-foreground">
                Правило сравнения
              </Text>
              <Text size={FontSize.sm} className="text-foreground">
                {verdict.criterion}
              </Text>
            </Box>
          ) : null}
          {source ? (
            <Box className="gap-1">
              <Text bold className="text-foreground">
                Источник эталона
              </Text>
              <Text size={FontSize.sm} className="text-foreground">
                {source.title}
              </Text>
              {source.authors || source.year || source.location ? (
                <Text size={FontSize.sm} className="text-muted-foreground">
                  {[source.authors, source.year, source.location]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
              {source.url ? (
                <Button
                  label="Открыть источник"
                  variant="outline"
                  onPress={() => openUrl(source.url as string)}
                />
              ) : null}
            </Box>
          ) : null}
          {verdict.explanation?.map((row) => (
            <Box key={row.code} className="gap-1">
              <Text bold className="text-foreground">
                {row.code} — {row.title}:{' '}
                {nf(row.value, row.code === 'U' || row.code === 'G' ? 2 : 1)}
                {row.unit ? ` ${row.unit}` : ''}
              </Text>
              <Text size={FontSize.sm} className="text-muted-foreground">
                {row.text}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
    </Card>
  )
}
