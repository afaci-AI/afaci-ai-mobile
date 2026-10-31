import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'

import type { Nutrient } from '@/modules/catalog/api'
import { useNutrientDictionaries } from '@/modules/catalog/api'
import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import {
  Button,
  ErrorState,
  FormField,
  Input,
  LoadingView,
  Select,
  useAppToast,
} from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui/modal'
import { Text } from '@/shared/ui/text'

import {
  createNutrient,
  invalidateAdminProducts,
  updateNutrient,
  type NutrientInput,
} from './api'
import { FontSize } from '@/shared/theme/font-sizes'

interface Props {
  productId: string
  nutrient: Nutrient | null
  nutrients: Nutrient[]
  onClose: () => void
}

function parseNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function NutrientDialog({
  productId,
  nutrient,
  nutrients,
  onClose,
}: Props) {
  const dictionaries = useNutrientDictionaries()
  const insets = useSafeAreaInsets()
  const client = useQueryClient()
  const toast = useAppToast()
  const owner = useSession((state) => state.user?.id)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const active = () =>
    mounted.current &&
    useSession.getState().user?.id === owner &&
    hasPermission(useSession.getState().user?.role, 'canEditProducts')
  const [nameId, setNameId] = useState(nutrient?.nutrient_name_id ?? '')
  const [unitId, setUnitId] = useState(nutrient?.unit_id ?? '')
  const [quantity, setQuantity] = useState(String(nutrient?.quantity ?? ''))
  const [errorRate, setErrorRate] = useState(String(nutrient?.error_rate ?? ''))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const [duplicate, setDuplicate] = useState<Nutrient | null>(null)

  const save = async (replace = false) => {
    if (saving.current || !active()) return
    const amount = parseNumber(quantity)
    const uncertainty = errorRate.trim() ? parseNumber(errorRate) : null
    const nextErrors: Record<string, string> = {}
    if (!nameId) nextErrors.name = 'Выберите нутриент.'
    if (!unitId) nextErrors.unit = 'Выберите единицу измерения.'
    if (amount === null) nextErrors.quantity = 'Введите неотрицательное число.'
    if (errorRate.trim() && uncertainty === null)
      nextErrors.errorRate = 'Введите неотрицательное число.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length || amount === null) return
    const existing = nutrients.find(
      (item) => item.nutrient_name_id === nameId && item.id !== nutrient?.id,
    )
    if (existing && !replace) {
      setDuplicate(existing)
      return
    }
    const input: NutrientInput = {
      nutrient_name_id: nameId,
      unit_id: unitId,
      quantity: amount,
      error_rate: uncertainty,
    }
    saving.current = true
    setPending(true)
    setError('')
    try {
      if (replace && duplicate) {
        await updateNutrient(duplicate.id, input)
      } else if (nutrient) await updateNutrient(nutrient.id, input)
      else await createNutrient(productId, input)
      if (!active()) return
      await invalidateAdminProducts(client)
      if (!active()) return
      toast.success({
        title: nutrient || replace ? 'Нутриент обновлён' : 'Нутриент добавлен',
      })
      onClose()
    } catch (cause) {
      if (!active()) return
      setError(
        cause instanceof Error
          ? cause.message
          : 'Не удалось сохранить нутриент.',
      )
    } finally {
      saving.current = false
      if (active()) setPending(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!pending) onClose()
      }}
      avoidKeyboard
      closeOnOverlayClick={!pending}
      // Safe area is device-dependent; constrain the scrollable form above the keyboard.
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ModalBackdrop />
      <ModalContent className="max-h-full shrink">
        <ModalHeader>
          <Heading size={FontSize.lg} className="text-foreground">
            {duplicate
              ? 'Нутриент уже есть'
              : nutrient
                ? 'Редактирование нутриента'
                : 'Добавление нутриента'}
          </Heading>
        </ModalHeader>
        <ModalBody
          scrollEnabled
          keyboardShouldPersistTaps="handled"
          className="shrink"
        >
          {duplicate ? (
            <Box className="gap-3">
              <Text className="text-foreground">
                {
                  dictionaries.data?.names.find((item) => item.id === nameId)
                    ?.name
                }{' '}
                уже добавлен: {formatNumber(duplicate.quantity, 4)}{' '}
                {
                  dictionaries.data?.units.find(
                    (item) => item.id === duplicate.unit_id,
                  )?.name
                }
                .
              </Text>
              <Text className="text-muted-foreground">
                {nutrient
                  ? 'Выберите другое название или измените существующую запись в списке.'
                  : `Заменить существующее значение на ${quantity} ${dictionaries.data?.units.find((item) => item.id === unitId)?.name ?? ''}?`}
              </Text>
            </Box>
          ) : dictionaries.isPending ? (
            <LoadingView />
          ) : dictionaries.isError ? (
            <ErrorState
              message={dictionaries.error.message}
              onRetry={() => void dictionaries.refetch()}
            />
          ) : (
            <Box className="gap-4">
              <FormField label="Нутриент" isRequired error={errors.name}>
                <Select
                  options={(dictionaries.data?.names ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  value={nameId}
                  onChange={setNameId}
                  isDisabled={pending}
                  placeholder="Выберите нутриент"
                />
              </FormField>
              <FormField
                label="Единица измерения"
                isRequired
                error={errors.unit}
              >
                <Select
                  options={(dictionaries.data?.units ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  value={unitId}
                  onChange={setUnitId}
                  isDisabled={pending}
                  placeholder="Выберите единицу"
                />
              </FormField>
              <FormField
                label="Количество на 100 г продукта"
                isRequired
                error={errors.quantity}
              >
                <Input
                  accessibilityLabel="Количество нутриента"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  isDisabled={pending}
                />
              </FormField>
              <FormField
                label="Погрешность"
                error={errors.errorRate}
                hint="Необязательно"
              >
                <Input
                  accessibilityLabel="Погрешность"
                  value={errorRate}
                  onChangeText={setErrorRate}
                  keyboardType="decimal-pad"
                  isDisabled={pending}
                />
              </FormField>
            </Box>
          )}
          {error ? (
            <Text
              accessibilityRole="alert"
              className="mt-3 text-destructive-text"
            >
              {error}
            </Text>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Box className="flex-row flex-wrap justify-end gap-2">
            <Button
              label={duplicate ? 'Назад' : 'Отмена'}
              variant="outline"
              isDisabled={pending}
              onPress={() => (duplicate ? setDuplicate(null) : onClose())}
            />
            {duplicate && nutrient ? null : (
              <Button
                label={duplicate ? 'Заменить' : 'Сохранить'}
                isLoading={pending}
                isDisabled={!dictionaries.data}
                onPress={() => void save(Boolean(duplicate))}
              />
            )}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
