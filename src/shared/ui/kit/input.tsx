import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react-native'

import {
  Input as GSInput,
  InputField,
  InputIcon,
  InputSlot,
} from '@/shared/ui/input'

type InputFieldProps = ComponentProps<typeof InputField>

interface InputProps extends InputFieldProps {
  /** Decorative icon before the editable value. */
  leadingIcon?: LucideIcon
  isInvalid?: boolean
  isDisabled?: boolean
  /** Слот справа: кнопка показа пароля, иконка, единица измерения. */
  rightSlot?: ReactNode
}

/** Текстовое поле с рамкой и состояниями из gluestack. */
export function Input({
  leadingIcon,
  isInvalid,
  isDisabled,
  rightSlot,
  ...props
}: InputProps) {
  return (
    <GSInput isInvalid={isInvalid} isDisabled={isDisabled}>
      {leadingIcon ? (
        <InputSlot accessible={false} pointerEvents="none">
          <InputIcon
            as={leadingIcon}
            accessible={false}
            className="text-muted-foreground"
          />
        </InputSlot>
      ) : null}
      <InputField {...props} />
      {rightSlot ? <InputSlot className="pr-3">{rightSlot}</InputSlot> : null}
    </GSInput>
  )
}
