import { useRef, type ComponentRef } from 'react'
import { Pressable, TextInput } from 'react-native'

import { Box } from '@/shared/ui/box'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  /** Вызывается, когда введены все цифры. */
  onComplete?: (value: string) => void
  length?: number
  isInvalid?: boolean
  isDisabled?: boolean
  autoFocus?: boolean
}

/**
 * Код по ячейкам: цифры набираются подряд, активная ячейка подсвечена и
 * сдвигается вправо, Backspace стирает последнюю. Под ячейками — одно
 * невидимое поле, поэтому работают вставка и автоподстановка кода из SMS/почты.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  isInvalid,
  isDisabled,
  autoFocus,
}: OtpInputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null)
  const active = Math.min(value.length, length - 1)

  const handleChange = (text: string) => {
    // Поле не блокируем (editable=false снимает фокус и прячет клавиатуру),
    // а просто игнорируем ввод, пока идёт проверка.
    if (isDisabled) return
    const digits = text.replace(/\D/g, '').slice(0, length)
    onChange(digits)
    if (digits.length === length) onComplete?.(digits)
  }

  return (
    <Pressable
      accessibilityLabel="Код из письма"
      onPress={() => inputRef.current?.focus()}
      disabled={isDisabled}
    >
      <Box className="flex-row justify-center gap-2">
        {Array.from({ length }, (_, index) => {
          const char = value[index] ?? ''
          const isActive = !isDisabled && index === active
          const border = isInvalid
            ? 'border-destructive'
            : isActive
              ? 'border-primary border-2'
              : char
                ? 'border-foreground/40'
                : 'border-border'
          return (
            <Box
              key={index}
              className={`h-14 w-12 items-center justify-center rounded-lg border bg-background ${border}`}
            >
              <Text bold size={FontSize.xxl} className="text-foreground">
                {char}
              </Text>
            </Box>
          )
        })}
      </Box>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        caretHidden
        accessibilityLabel="Код из письма"
        className="absolute inset-0 text-transparent"
        style={{ opacity: 0.01 }}
      />
    </Pressable>
  )
}
