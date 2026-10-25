import type { PropsWithChildren } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@/shared/lib/cn'
import { Box } from '@/shared/ui/box'
import { ScrollView } from '@/shared/ui/scroll-view'

type Edge = 'top' | 'bottom'

interface ScreenProps extends PropsWithChildren {
  className?: string
  /** Какие системные отступы учитывать. По умолчанию — верх и низ. */
  edges?: Edge[]
}

/**
 * Базовый экран: фон из семантического токена и безопасные отступы.
 * Отступы считаются из инсетов, потому что `SafeAreaView` не принимает
 * className от NativeWind.
 */
export function Screen({
  children,
  className,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <Box
      className={cn('flex-1 bg-background', className)}
      style={{
        paddingTop: edges.includes('top') ? insets.top : 0,
        paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
      }}
    >
      {children}
    </Box>
  )
}

interface ScrollScreenProps extends ScreenProps {
  contentClassName?: string
}

/** Экран с вертикальной прокруткой и отступами контента. */
export function ScrollScreen({
  children,
  className,
  contentClassName,
  edges = ['top'],
}: ScrollScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <Screen className={className} edges={edges}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow"
        contentContainerStyle={{
          // Dynamic safe-area inset cannot be expressed by a static utility.
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Box className={cn('gap-4 px-4 py-4', contentClassName)}>
          {children}
        </Box>
      </ScrollView>
    </Screen>
  )
}
