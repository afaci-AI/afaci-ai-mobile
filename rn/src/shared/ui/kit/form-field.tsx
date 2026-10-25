import type { ReactNode } from 'react'

import { Box } from '@/shared/ui/box'
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from '@/shared/ui/form-control'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  isRequired?: boolean
  children: ReactNode
}

/** Подпись, поле и сообщение об ошибке/подсказка — единый вид форм. */
export function FormField({
  label,
  error,
  hint,
  isRequired,
  children,
}: FormFieldProps) {
  const isInvalid = Boolean(error)

  return (
    <FormControl isInvalid={isInvalid} isRequired={isRequired}>
      <Box className="gap-2">
        <FormControlLabel>
          <FormControlLabelText className="text-foreground">
            {label}
          </FormControlLabelText>
        </FormControlLabel>

        {children}

        {error ? (
          <FormControlError>
            <FormControlErrorText>{error}</FormControlErrorText>
          </FormControlError>
        ) : null}

        {!error && hint ? (
          <FormControlHelper>
            <FormControlHelperText>{hint}</FormControlHelperText>
          </FormControlHelper>
        ) : null}
      </Box>
    </FormControl>
  )
}
