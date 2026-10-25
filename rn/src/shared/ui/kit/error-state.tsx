import { AlertCircle } from 'lucide-react-native'

import { Box } from '@/shared/ui/box'
import { Icon } from '@/shared/ui/icon'
import { Text } from '@/shared/ui/text'

import { Button } from './button'

interface ErrorStateProps {
  message: string
  title?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  message,
  title = 'Не удалось загрузить данные',
  onRetry,
  retryLabel = 'Повторить',
}: ErrorStateProps) {
  return (
    <Box className="items-center justify-center gap-3 px-6 py-12">
      <Icon as={AlertCircle} size="xl" className="text-destructive" />
      <Text className="text-center text-foreground">{title}</Text>
      <Text size="sm" className="text-center text-muted-foreground">
        {message}
      </Text>
      {onRetry ? (
        <Button
          label={retryLabel}
          variant="outline"
          size="sm"
          onPress={onRetry}
        />
      ) : null}
    </Box>
  )
}
