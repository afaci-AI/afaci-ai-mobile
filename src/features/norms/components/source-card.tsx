import { useState } from 'react'

import { Box } from '@/shared/ui/box'
import { Badge, Button, Card } from '@/shared/ui/kit'
import { Heading } from '@/shared/ui/heading'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

import { openSource, sourceUrl } from '../open-source'
import { SOURCE_KIND_LABELS, type Source } from '../types'

export function SourceCard({ source }: { source: Source }) {
  const [error, setError] = useState(false)
  const [opening, setOpening] = useState(false)
  const hasLink = Boolean(sourceUrl(source))

  const open = async () => {
    setOpening(true)
    setError(false)
    const opened = await openSource(source)
    setOpening(false)
    setError(!opened)
  }

  return (
    <Card>
      <Box className="flex-row flex-wrap items-center gap-2">
        <Badge
          label={SOURCE_KIND_LABELS[source.kind] ?? source.kind}
          variant="secondary"
        />
        {source.year != null ? (
          <Text size={FontSize.sm} className="text-muted-foreground">
            {source.year}
          </Text>
        ) : null}
      </Box>
      <Heading size={FontSize.sm} className="text-card-foreground">
        {source.title}
      </Heading>
      {source.authors ? (
        <Text size={FontSize.sm} className="text-muted-foreground">
          {source.authors}
        </Text>
      ) : null}
      {source.used_for ? (
        <Text size={FontSize.sm} className="text-foreground">
          Где применяется: {source.used_for}
        </Text>
      ) : null}
      {source.location ? (
        <Text size={FontSize.sm} className="text-muted-foreground">
          {source.location}
        </Text>
      ) : null}
      {hasLink ? (
        <Button
          label={source.pdf_url ? 'Открыть документ' : 'Открыть источник'}
          variant="outline"
          isLoading={opening}
          onPress={() => void open()}
        />
      ) : null}
      {error ? (
        <Text
          size={FontSize.sm}
          className="text-destructive-text"
          accessibilityRole="alert"
        >
          Не удалось открыть ссылку. Проверьте подключение к интернету и наличие
          браузера, затем повторите попытку.
        </Text>
      ) : null}
    </Card>
  )
}
