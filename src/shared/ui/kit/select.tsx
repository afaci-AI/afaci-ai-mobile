import {
  Check,
  ChevronDown,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@/shared/lib/cn'
import { Box } from '@/shared/ui/box'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { FlatList } from '@/shared/ui/flat-list'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { Input } from './input'
import { FontSize } from '@/shared/theme/font-sizes'

export interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  leadingIcon?: LucideIcon
  options: SelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  isDisabled?: boolean
  isInvalid?: boolean
  /** Compact selected value; trigger touch target stays 48 dp. */
  selectedTextSize?: typeof FontSize.sm
}

/** Searchable bottom panel shared by dictionary and form selections. */
export function Select({
  leadingIcon,
  options,
  value,
  onChange,
  placeholder = 'Выберите значение',
  isDisabled,
  isInvalid,
  selectedTextSize,
}: SelectProps) {
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selectedLabel = options.find((option) => option.value === value)?.label
  const query = search.trim().toLocaleLowerCase('ru-RU')
  const filtered = query
    ? options.filter((option) =>
        option.label.toLocaleLowerCase('ru-RU').includes(query),
      )
    : options
  const close = () => setOpen(false)

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selectedLabel || placeholder}
        accessibilityHint="Открывает список с поиском"
        accessibilityState={{ disabled: Boolean(isDisabled), expanded: open }}
        disabled={isDisabled}
        className={cn(
          'min-h-12 flex-row items-center gap-3 rounded border border-border px-3 py-3 data-[active=true]:bg-muted',
          isDisabled && 'bg-muted/50',
          isInvalid && 'border-destructive',
        )}
        onPress={() => {
          setSearch('')
          setOpen(true)
        }}
      >
        {leadingIcon ? (
          <Icon as={leadingIcon} className="text-muted-foreground" />
        ) : null}
        <Text
          size={selectedTextSize ?? FontSize.md}
          numberOfLines={1}
          className={cn(
            'min-w-0 flex-1',
            selectedLabel ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {selectedLabel || placeholder}
        </Text>
        <Icon as={ChevronDown} className="text-muted-foreground" />
      </Pressable>
      <Modal
        isOpen={open && !isDisabled}
        onClose={close}
        size="full"
        useRNModal
        avoidKeyboard
        className="justify-end"
        // Device insets are dynamic: keep every row below the status bar.
        style={{ paddingTop: insets.top + 16 }}
      >
        <ModalBackdrop />
        <ModalContent
          className="h-3/4 max-h-full w-full shrink rounded-t-2xl rounded-b-none p-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          entering={SlideInDown.duration(220).reduceMotion(ReduceMotion.System)}
          exiting={SlideOutDown.duration(180).reduceMotion(ReduceMotion.System)}
        >
          <Box className="mb-3 h-1 w-12 self-center rounded-full bg-muted" />
          <ModalHeader className="mb-3 gap-3">
            <Heading size={FontSize.md} className="flex-1 text-foreground">
              {placeholder}
            </Heading>
            <IconButton
              variant="ghost"
              size="icon"
              className="min-h-12 min-w-12"
              accessibilityLabel="Закрыть список"
              onPress={close}
            >
              <ButtonIcon as={X} />
            </IconButton>
          </ModalHeader>
          <Input
            leadingIcon={Search}
            accessibilityLabel="Поиск в списке"
            placeholder="Поиск по названию"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <FlatList
            className="mt-3 flex-1"
            data={filtered}
            keyExtractor={(item) => item.value}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              <Text className="px-3 py-6 text-muted-foreground">
                {options.length ? 'Ничего не найдено.' : 'Список пока пуст.'}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityState={{ checked: item.value === value }}
                className={cn(
                  'min-h-12 flex-row items-center gap-3 rounded-md px-3 py-3 data-[active=true]:bg-accent',
                  item.value === value && 'bg-muted',
                )}
                onPress={() => {
                  onChange(item.value)
                  close()
                }}
              >
                <Text className="flex-1 text-foreground">{item.label}</Text>
                {item.value === value ? (
                  <Icon as={Check} className="text-primary" />
                ) : null}
              </Pressable>
            )}
          />
        </ModalContent>
      </Modal>
    </>
  )
}
