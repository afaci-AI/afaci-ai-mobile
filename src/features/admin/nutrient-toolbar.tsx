import { Search, SlidersHorizontal } from 'lucide-react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { DictionaryEntry } from '@/features/catalog'
import { FontSize } from '@/shared/theme/font-sizes'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Input, InputField, InputIcon, InputSlot } from '@/shared/ui/input'
import { Button, Chip } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui/modal'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

export const UNTYPED_NUTRIENTS = '__untyped__'

export function NutrientToolbar({
  search,
  onSearch,
  typeId,
  onTypeChange,
  types,
}: {
  search: string
  onSearch: (value: string) => void
  typeId: string
  onTypeChange: (value: string) => void
  types: DictionaryEntry[]
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(typeId)
  const insets = useSafeAreaInsets()

  return (
    <VStack space="sm">
      <HStack space="sm" className="items-center">
        <Box className="min-w-0 flex-1">
          <Input className="min-h-12 rounded-xl bg-background">
            <InputSlot accessible={false} pointerEvents="none">
              <InputIcon as={Search} className="text-muted-foreground" />
            </InputSlot>
            <InputField
              accessibilityLabel="Поиск нутриентов по названию"
              placeholder="Поиск нутриентов"
              value={search}
              onChangeText={onSearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </Input>
        </Box>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            typeId ? 'Фильтры по составу, выбрано: 1' : 'Фильтры по составу'
          }
          className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-background data-[active=true]:bg-muted"
          onPress={() => {
            setDraft(typeId)
            setOpen(true)
          }}
        >
          <Icon as={SlidersHorizontal} className="text-foreground" />
          {typeId ? (
            <Box className="absolute right-1 top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
              <Text size={FontSize.xs} className="text-primary-foreground">
                1
              </Text>
            </Box>
          ) : null}
        </Pressable>
      </HStack>
      {search || typeId ? (
        <HStack space="sm" className="items-center">
          <Text size={FontSize.sm} className="flex-1 text-muted-foreground">
            {typeId
              ? (types.find((item) => item.id === typeId)?.name ?? 'Без типа')
              : 'Поиск по названию'}
          </Text>
          <Button
            label="Сбросить"
            variant="ghost"
            onPress={() => {
              onSearch('')
              onTypeChange('')
            }}
          />
        </HStack>
      ) : null}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        useRNModal
        size="full"
        className="justify-end"
        // Insets vary by device; keep filter actions above system navigation.
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}
      >
        <ModalBackdrop />
        <ModalContent className="max-h-full rounded-t-2xl rounded-b-none">
          <ModalHeader>
            <Heading size={FontSize.lg} className="text-foreground">
              Фильтры
            </Heading>
          </ModalHeader>
          <ModalBody scrollEnabled className="shrink">
            <VStack space="sm">
              <Heading size={FontSize.sm} className="text-foreground">
                Состав
              </Heading>
              <HStack space="sm" className="flex-wrap">
                <Chip
                  className="min-h-12"
                  label="Все составы"
                  selected={!draft}
                  onPress={() => setDraft('')}
                />
                {types.map((item) => (
                  <Chip
                    key={item.id}
                    className="min-h-12"
                    label={item.name}
                    selected={draft === item.id}
                    onPress={() => setDraft(item.id)}
                  />
                ))}
                <Chip
                  className="min-h-12"
                  label="Без типа"
                  selected={draft === UNTYPED_NUTRIENTS}
                  onPress={() => setDraft(UNTYPED_NUTRIENTS)}
                />
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space="sm" className="w-full">
              <Button
                label="Сбросить"
                variant="outline"
                className="flex-1"
                isDisabled={!draft}
                onPress={() => setDraft('')}
              />
              <Button
                label={draft ? 'Показать (1)' : 'Показать'}
                className="flex-1"
                onPress={() => {
                  onTypeChange(draft)
                  setOpen(false)
                }}
              />
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
