import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
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
  invalidateDictionaries,
  listDictionary,
  saveDictionaryEntry,
  type AdminDictionaryEntry,
  type DictionaryKind,
} from './dictionaries-api'
import { FontSize } from '@/shared/theme/font-sizes'

export function DictionaryDialog({
  kind,
  entry,
  onClose,
}: {
  kind: DictionaryKind
  entry: AdminDictionaryEntry | null
  onClose: () => void
}) {
  const client = useQueryClient()
  const toast = useAppToast()
  const insets = useSafeAreaInsets()
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
    hasPermission(useSession.getState().user?.role, 'canEditDictionaries')
  const [name, setName] = useState(entry?.name ?? '')
  const [parentId, setParentId] = useState(
    entry?.category_id ?? entry?.nutrient_type_id ?? '',
  )
  const [unitId, setUnitId] = useState(entry?.unit_id ?? '')
  const [error, setError] = useState('')
  const [validation, setValidation] = useState(false)
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const parentKind =
    kind === 'subcategories'
      ? 'categories'
      : kind === 'nutrient-names'
        ? 'nutrient-types'
        : null
  const parents = useQuery({
    queryKey: ['admin', 'dictionary', parentKind],
    queryFn: () => listDictionary(parentKind!),
    enabled: Boolean(parentKind),
  })
  const needsUnit = kind === 'nutrient-names'
  const units = useQuery({
    queryKey: ['admin', 'dictionary', 'units'],
    queryFn: () => listDictionary('units'),
    enabled: needsUnit,
  })
  const save = async () => {
    if (saving.current || !active()) return
    setValidation(true)
    if (!name.trim() || (parentKind && !parentId) || (needsUnit && !unitId))
      return
    saving.current = true
    setPending(true)
    setError('')
    try {
      await saveDictionaryEntry(
        kind,
        {
          name: name.trim(),
          ...(kind === 'subcategories'
            ? { category_id: parentId }
            : kind === 'nutrient-names'
              ? { nutrient_type_id: parentId, unit_id: unitId }
              : {}),
        },
        entry?.id,
      )
      if (!active()) return
      await invalidateDictionaries(client)
      if (!active()) return
      toast.success({ title: entry ? 'Запись обновлена' : 'Запись создана' })
      onClose()
    } catch (cause) {
      if (active())
        setError(
          cause instanceof Error
            ? cause.message
            : 'Не удалось сохранить запись.',
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
      // Insets depend on the device and keep the scrollable form above the keyboard.
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ModalBackdrop />
      <ModalContent className="max-h-full shrink">
        <ModalHeader>
          <Heading size={FontSize.lg} className="text-foreground">
            {entry ? 'Редактирование записи' : 'Новая запись'}
          </Heading>
        </ModalHeader>
        <ModalBody
          scrollEnabled
          keyboardShouldPersistTaps="handled"
          className="shrink"
        >
          <Box className="gap-4">
            <FormField
              label="Название"
              isRequired
              error={
                validation && !name.trim() ? 'Введите название.' : undefined
              }
            >
              <Input
                accessibilityLabel="Название записи"
                value={name}
                onChangeText={setName}
                isDisabled={pending}
                autoFocus
              />
            </FormField>
            {parentKind ? (
              parents.isPending ? (
                <LoadingView fullscreen={false} />
              ) : parents.isError ? (
                <ErrorState
                  message={parents.error.message}
                  onRetry={() => void parents.refetch()}
                />
              ) : (
                <FormField
                  label={
                    kind === 'subcategories' ? 'Категория' : 'Тип нутриента'
                  }
                  isRequired
                  error={
                    validation && !parentId ? 'Выберите группу.' : undefined
                  }
                >
                  <Select
                    options={(parents.data ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    value={parentId}
                    onChange={setParentId}
                    isDisabled={pending}
                    placeholder="Выберите группу"
                  />
                </FormField>
              )
            ) : null}
            {needsUnit ? (
              units.isPending ? (
                <LoadingView fullscreen={false} />
              ) : units.isError ? (
                <ErrorState
                  message={units.error.message}
                  onRetry={() => void units.refetch()}
                />
              ) : (
                <FormField
                  label="Единица измерения"
                  isRequired
                  error={
                    validation && !unitId
                      ? 'Выберите единицу измерения.'
                      : undefined
                  }
                  hint="Подставляется при добавлении значения этого нутриента к продукту."
                >
                  <Select
                    options={(units.data ?? []).map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    value={unitId}
                    onChange={setUnitId}
                    isDisabled={pending}
                    placeholder="Выберите единицу"
                  />
                </FormField>
              )
            ) : null}
            {error ? (
              <Text accessibilityRole="alert" className="text-destructive-text">
                {error}
              </Text>
            ) : null}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box className="flex-row flex-wrap justify-end gap-2">
            <Button
              label="Отмена"
              variant="outline"
              isDisabled={pending}
              onPress={onClose}
            />
            <Button
              label="Сохранить"
              isLoading={pending}
              isDisabled={Boolean(
                (parentKind && !parents.data) || (needsUnit && !units.data),
              )}
              onPress={() => void save()}
            />
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
