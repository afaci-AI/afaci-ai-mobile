import { Box } from '@/shared/ui/box'
import { Spinner } from '@/shared/ui/spinner'
import { Text } from '@/shared/ui/text'

interface LoadingViewProps {
  label?: string
  /** Растянуть на весь экран (по умолчанию) или показать компактно. */
  fullscreen?: boolean
}

export function LoadingView({
  label = 'Загрузка…',
  fullscreen = true,
}: LoadingViewProps) {
  return (
    <Box
      className={
        fullscreen
          ? 'flex-1 items-center justify-center gap-3 bg-background'
          : 'items-center justify-center gap-2 py-6'
      }
    >
      <Spinner className="text-primary" />
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
    </Box>
  )
}
