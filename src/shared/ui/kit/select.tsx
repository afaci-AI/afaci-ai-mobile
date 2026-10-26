import { ChevronDown } from 'lucide-react-native'

import {
  Select as GSSelect,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectScrollView,
  SelectTrigger,
} from '@/shared/ui/select'

export interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  isDisabled?: boolean
  isInvalid?: boolean
  /** Compact selected value; trigger touch target stays 48 dp. */
  selectedTextSize?: 'sm'
}

/** Выпадающий список на actionsheet — работает одинаково на Android и iOS. */
export function Select({
  options,
  value,
  onChange,
  placeholder = 'Выберите значение',
  isDisabled,
  isInvalid,
  selectedTextSize,
}: SelectProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <GSSelect
      selectedValue={value ?? undefined}
      onValueChange={onChange}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
    >
      <SelectTrigger
        size="xl"
        accessibilityLabel={selectedLabel || placeholder}
      >
        {/* The core retains its internal label after a controlled value reset. */}
        <SelectInput
          placeholder={placeholder}
          value={selectedLabel ?? ''}
          className={
            selectedTextSize === 'sm' ? 'text-sm font-sans' : undefined
          }
        />
        <SelectIcon className="mr-2" as={ChevronDown} />
      </SelectTrigger>

      <SelectPortal>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>

          <SelectScrollView>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                label={option.label}
                value={option.value}
                className="min-h-12"
              />
            ))}
          </SelectScrollView>
        </SelectContent>
      </SelectPortal>
    </GSSelect>
  )
}
