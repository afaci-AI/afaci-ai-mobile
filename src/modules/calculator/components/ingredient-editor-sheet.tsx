import { Search } from 'lucide-react-native'
import { useState } from 'react'
import {
  ReduceMotion,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Button, FormField, Input } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { VStack } from '@/shared/ui/vstack'
import { Text } from '@/shared/ui/text'

import { parseNumberInput } from '../helpers'

import type { CalculatorRow } from '../types'
import { ProductSearchModal } from './product-search-modal'

interface IngredientEditorSheetProps {
  open: boolean
  row: CalculatorRow | null
  costEnabled: boolean
  excludedIds?: string[]
  onClose: () => void
  onSave: (row: CalculatorRow) => void
}

export function IngredientEditorSheet(props: IngredientEditorSheetProps) {
  // Remount only when starting an edit, so cancel never changes calculator data.
  if (!props.open || !props.row) return null
  return <IngredientEditorForm key={props.row.key} {...props} row={props.row} />
}

function IngredientEditorForm({
  row,
  costEnabled,
  excludedIds,
  onClose,
  onSave,
}: IngredientEditorSheetProps & { row: CalculatorRow }) {
  const [draft, setDraft] = useState(() => ({ ...row }))
  const [searchOpen, setSearchOpen] = useState(false)
  const [error, setError] = useState('')
  const insets = useSafeAreaInsets()
  const save = () => {
    if (!draft.product_id) {
      setError('Выберите ингредиент.')
      return
    }
    if (parseNumberInput(draft.amount) === null) {
      setError(
        'Укажите массу числом от 0. Десятичную часть можно отделить запятой.',
      )
      return
    }
    if (costEnabled && parseNumberInput(draft.price) === null) {
      setError('Укажите цену числом от 0 сом/кг.')
      return
    }
    onSave(draft)
    onClose()
  }
  return (
    <>
      {/* Only one overlay is mounted: choosing a product retains the local draft. */}
      {searchOpen ? (
        <ProductSearchModal
          open
          onClose={() => setSearchOpen(false)}
          excludedIds={excludedIds}
          onSelect={(product) => {
            setDraft((current) => ({
              ...current,
              product_id: product.product_id,
              product_name: product.product_name,
            }))
            setSearchOpen(false)
          }}
        />
      ) : (
        <Modal
          isOpen
          onClose={onClose}
          size="full"
          avoidKeyboard
          className="justify-end"
          style={{ paddingTop: insets.top }}
        >
          <ModalBackdrop />
          <ModalContent
            className="max-h-full w-full shrink rounded-t-2xl rounded-b-none p-4"
            // Insets are dynamic; only this panel owns the bottom safe area.
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            entering={SlideInDown.duration(220).reduceMotion(
              ReduceMotion.System,
            )}
            exiting={SlideOutDown.duration(180).reduceMotion(
              ReduceMotion.System,
            )}
          >
            <Box className="mb-4 h-1 w-12 self-center rounded-full bg-muted" />
            <ModalHeader>
              <Heading size="md" className="text-foreground">
                Редактирование ингредиента
              </Heading>
            </ModalHeader>
            <ModalBody
              scrollEnabled
              keyboardShouldPersistTaps="handled"
              className="mb-0 shrink"
            >
              <VStack space="lg" className="pt-2 pb-2">
                <FormField label="Ингредиент">
                  <Button
                    label={draft.product_name || 'Выберите ингредиент'}
                    icon={Search}
                    variant="outline"
                    className="h-auto min-h-12 py-3"
                    onPress={() => setSearchOpen(true)}
                  />
                </FormField>
                <FormField label="Масса, г">
                  <Input
                    accessibilityLabel="Масса ингредиента, г"
                    keyboardType="decimal-pad"
                    value={draft.amount}
                    onChangeText={(amount) =>
                      setDraft((current) => ({ ...current, amount }))
                    }
                    placeholder="Не указана"
                  />
                </FormField>
                {costEnabled ? (
                  <FormField label="Цена, сом/кг">
                    <Input
                      accessibilityLabel="Цена ингредиента, сом за килограмм"
                      keyboardType="decimal-pad"
                      value={draft.price}
                      onChangeText={(price) =>
                        setDraft((current) => ({ ...current, price }))
                      }
                      placeholder="Не указана"
                    />
                  </FormField>
                ) : null}
                {error ? (
                  <Text
                    accessibilityRole="alert"
                    className="text-destructive-text"
                  >
                    {error}
                  </Text>
                ) : null}
                <Button
                  label="Сохранить"
                  isDisabled={!draft.product_id}
                  className="min-h-12"
                  onPress={save}
                />
                <Button
                  label="Отмена"
                  variant="outline"
                  className="min-h-12"
                  onPress={onClose}
                />
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}
