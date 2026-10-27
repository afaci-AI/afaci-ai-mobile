import { ChevronLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'

interface HeaderProps {
  title: string
  subtitle?: string
  /** Кнопка «назад»: показывается, только если передан обработчик. */
  onBack?: () => void
  right?: ReactNode
  className?: string
}

export function Header({
  title,
  subtitle,
  onBack,
  right,
  className,
}: HeaderProps) {
  return (
    <Box
      className={cn(
        'flex-row items-center gap-2 border-b border-border bg-background px-4 py-3',
        className,
      )}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={onBack}
          className="-ml-2 h-12 w-12 items-center justify-center rounded-md data-[active=true]:bg-muted"
        >
          <Icon as={ChevronLeft} size="lg" className="text-foreground" />
        </Pressable>
      ) : null}

      <Box className="flex-1">
        <Heading size="lg" className="text-foreground">
          {title}
        </Heading>
        {subtitle ? (
          <Text size="sm" className="text-muted-foreground">
            {subtitle}
          </Text>
        ) : null}
      </Box>

      {right}
    </Box>
  )
}
