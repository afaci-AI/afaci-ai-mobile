import type { ComponentProps, ReactNode } from 'react'

import { Input as GSInput, InputField, InputSlot } from '@/shared/ui/input'

type InputFieldProps = ComponentProps<typeof InputField>

interface InputProps extends InputFieldProps {
  isInvalid?: boolean
  isDisabled?: boolean
  /** Слот справа: кнопка показа пароля, иконка, единица измерения. */
  rightSlot?: ReactNode
}

/** Текстовое поле с рамкой и состояниями из gluestack. */
export function Input({
  isInvalid,
  isDisabled,
  rightSlot,
  ...props
}: InputProps) {
  return (
    <GSInput isInvalid={isInvalid} isDisabled={isDisabled}>
      <InputField {...props} />
      {rightSlot ? <InputSlot className="pr-3">{rightSlot}</InputSlot> : null}
    </GSInput>
  )
}
