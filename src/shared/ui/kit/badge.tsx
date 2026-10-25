import type { ComponentProps } from 'react'

import { Badge as GSBadge, BadgeText } from '@/shared/ui/badge'

type BadgeVariant = NonNullable<ComponentProps<typeof GSBadge>['variant']>

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

export function Badge({ label, variant = 'secondary', className }: BadgeProps) {
  return (
    <GSBadge variant={variant} className={className}>
      <BadgeText>{label}</BadgeText>
    </GSBadge>
  )
}
