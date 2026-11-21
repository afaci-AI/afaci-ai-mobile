import { Box } from '@/shared/ui/box'
import { Pressable } from '@/shared/ui/pressable'
import { Switch as GSSwitch } from '@/shared/ui/switch'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

interface SwitchRowProps {
  label: string
  description?: string
  value: boolean
  onValueChange: (value: boolean) => void
  isDisabled?: boolean
}

/** Переключатель с подписью: вся строка — зона нажатия. */
export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  isDisabled,
}: SwitchRowProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onValueChange(!value)}
      className="flex-row items-center justify-between gap-4 py-2 data-[disabled=true]:bg-muted/50"
    >
      <Box className="flex-1 gap-1">
        <Text className="text-foreground">{label}</Text>
        {description ? (
          <Text size={FontSize.sm} className="text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </Box>

      <GSSwitch
        value={value}
        onToggle={onValueChange}
        isDisabled={isDisabled}
      />
    </Pressable>
  )
}
