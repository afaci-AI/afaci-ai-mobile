import { cn } from '@/shared/lib/cn'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'

interface ChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  className?: string
}

/** Чип выбора: вариант значения словаря вместо строки списка. */
export function Chip({
  label,
  selected = false,
  onPress,
  className,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        'min-h-10 justify-center rounded-full border px-4 py-2',
        selected
          ? 'border-primary bg-primary'
          : 'border-border bg-background data-[active=true]:bg-muted',
        className,
      )}
    >
      <Text
        size="sm"
        className={selected ? 'text-primary-foreground' : 'text-foreground'}
      >
        {label}
      </Text>
    </Pressable>
  )
}
