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
}

/** Выпадающий список на actionsheet — работает одинаково на Android и iOS. */
export function Select({
  options,
  value,
  onChange,
  placeholder = 'Выберите значение',
  isDisabled,
  isInvalid,
}: SelectProps) {
  return (
    <GSSelect
      selectedValue={value ?? undefined}
      onValueChange={onChange}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
    >
      <SelectTrigger>
        <SelectInput placeholder={placeholder} />
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
              />
            ))}
          </SelectScrollView>
        </SelectContent>
      </SelectPortal>
    </GSSelect>
  )
}
