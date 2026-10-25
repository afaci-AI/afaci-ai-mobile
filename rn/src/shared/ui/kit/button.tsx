import type { LucideIcon } from 'lucide-react-native'
import type { ComponentProps } from 'react'

import {
  Button as GSButton,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from '@/shared/ui/button'

type GSButtonProps = ComponentProps<typeof GSButton>

interface ButtonProps extends Omit<GSButtonProps, 'children'> {
  label: string
  isLoading?: boolean
  icon?: LucideIcon
}

export function Button({
  label,
  isLoading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <GSButton disabled={disabled || isLoading} {...props}>
      {isLoading ? <ButtonSpinner /> : null}
      {!isLoading && icon ? <ButtonIcon as={icon} /> : null}
      <ButtonText>{label}</ButtonText>
    </GSButton>
  )
}

export { ButtonSpinner, ButtonText }
