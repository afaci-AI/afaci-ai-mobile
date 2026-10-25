import { Inbox, type LucideIcon } from 'lucide-react-native'
import type { ReactNode } from 'react'

import { Box } from '@/shared/ui/box'
import { Icon } from '@/shared/ui/icon'
import { Text } from '@/shared/ui/text'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <Box className="items-center justify-center gap-3 px-6 py-12">
      <Icon as={icon} size="xl" className="text-muted-foreground" />
      <Text className="text-center text-foreground">{title}</Text>
      {description ? (
        <Text size="sm" className="text-center text-muted-foreground">
          {description}
        </Text>
      ) : null}
      {action}
    </Box>
  )
}
