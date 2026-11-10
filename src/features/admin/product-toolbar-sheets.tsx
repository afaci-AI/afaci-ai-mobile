import { useState, type ReactNode } from 'react'
import { Circle, CircleDot, Search } from 'lucide-react-native'
import {
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Button, Input } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import type { ProductSort } from './product-filters-store'
import { FontSize } from '@/shared/theme/font-sizes'

function ToolbarSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal
      isOpen
      size="full"
      avoidKeyboard
      className="justify-end"
      onClose={onClose}
      style={{ paddingTop: insets.top }}
    >
      <ModalBackdrop />
      <ModalContent
        className="max-h-full w-full shrink rounded-t-2xl rounded-b-none p-4"
        // This panel owns the device's dynamic bottom safe-area inset.
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        entering={SlideInDown.duration(220).reduceMotion(ReduceMotion.System)}
        exiting={SlideOutDown.duration(180).reduceMotion(ReduceMotion.System)}
      >
        <Box className="mb-4 h-1 w-12 self-center rounded-full bg-muted" />
        <ModalHeader>
          <Heading size={FontSize.md} className="text-foreground">
            {title}
          </Heading>
        </ModalHeader>
        <ModalBody className="shrink" keyboardShouldPersistTaps="handled">
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export function ProductSearchSheet({
  search,
  onApply,
  onClose,
}: {
  search: string
  onApply: (value: string) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(search)
  const apply = () => {
    onApply(draft)
    onClose()
  }
  return (
    <ToolbarSheet title="Поиск продукта" onClose={onClose}>
      <VStack space="lg">
        <Input
          autoFocus
          leadingIcon={Search}
          accessibilityLabel="Название искомого продукта"
          placeholder="Поиск по названию"
          value={draft}
          onChangeText={setDraft}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={apply}
        />
        <HStack space="sm">
          <Button
            label="Очистить"
            variant="outline"
            className="flex-1 min-h-12"
            onPress={() => {
              onApply('')
              onClose()
            }}
          />
          <Button label="Найти" className="flex-1 min-h-12" onPress={apply} />
        </HStack>
        <Button label="Отмена" variant="ghost" onPress={onClose} />
      </VStack>
    </ToolbarSheet>
  )
}

export function ProductSortSheet({
  sort,
  onApply,
  onClose,
}: {
  sort: ProductSort
  onApply: (value: ProductSort) => void
  onClose: () => void
}) {
  return (
    <ToolbarSheet title="Сортировка продуктов" onClose={onClose}>
      <VStack
        space="sm"
        accessibilityRole="radiogroup"
        accessibilityLabel="Порядок сортировки по названию"
      >
        {(
          [
            { value: 'product_name:asc', label: 'Название: А–Я' },
            { value: 'product_name:desc', label: 'Название: Я–А' },
          ] as const
        ).map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: sort === option.value }}
            className="min-h-12 flex-row items-center gap-3 rounded-md px-3 py-3 data-[active=true]:bg-accent"
            onPress={() => {
              onApply(option.value)
              onClose()
            }}
          >
            <Icon
              as={sort === option.value ? CircleDot : Circle}
              className={
                sort === option.value ? 'text-primary' : 'text-muted-foreground'
              }
            />
            <Text className="flex-1 text-foreground">{option.label}</Text>
          </Pressable>
        ))}
        <Button label="Закрыть" variant="outline" onPress={onClose} />
      </VStack>
    </ToolbarSheet>
  )
}
