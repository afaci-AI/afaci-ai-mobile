import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/cn'
import { Card as GSCard } from '@/shared/ui/card'

type CardProps = ComponentProps<typeof GSCard>

/** Карточка контента на семантических токенах. */
export function Card({ className, ...props }: CardProps) {
  return (
    <GSCard
      className={cn(
        'gap-4 rounded-xl border border-border bg-card p-4',
        className,
      )}
      {...props}
    />
  )
}
