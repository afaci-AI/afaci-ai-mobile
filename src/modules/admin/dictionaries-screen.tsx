import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { FlatList } from '@/shared/ui/flat-list'
import { Heading } from '@/shared/ui/heading'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FormField,
  Header,
  Input,
  LoadingView,
  Screen,
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
  deleteDictionaryEntry,
  dictionaryLabels,
  invalidateDictionaries,
  isDictionaryKind,
  listDictionary,
  saveDictionaryEntry,
  type AdminDictionaryEntry,
  type DictionaryKind,
} from './dictionaries-api'
import { FontSize } from '@/shared/theme/font-sizes'

export default function DictionariesScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>()
  if (!kind || !isDictionaryKind(kind)) return <Redirect href="/admin" />
  return <DictionaryScreen key={kind} kind={kind} />
}

function DictionaryScreen({ kind }: { kind: DictionaryKind }) {
  const router = useRouter()
  const user = useSession((state) => state.user)
  const canEdit = hasPermission(user?.role, 'canEditDictionaries')
  const client = useQueryClient()
  const toast = useAppToast()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<AdminDictionaryEntry | 'new' | null>(
    null,
  )
  const [deleting, setDeleting] = useState<AdminDictionaryEntry | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const saving = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const active = () =>
    mounted.current &&
    useSession.getState().user?.id === user?.id &&
    hasPermission(useSession.getState().user?.role, 'canEditDictionaries')
  const entries = useQuery({
    queryKey: ['admin', 'dictionary', kind],
    queryFn: () => listDictionary(kind),
    enabled: Boolean(user),
  })
  const parentKind =
    kind === 'subcategories'
      ? 'categories'
      : kind === 'nutrient-names'
        ? 'nutrient-types'
        : null
  const parents = useQuery({
    queryKey: ['admin', 'dictionary', parentKind],
    queryFn: () => listDictionary(parentKind!),
    enabled: Boolean(user && parentKind),
  })
  const remove = async () => {
    if (!deleting || saving.current || !active()) return
    saving.current = true
    setPending(true)
    setError('')
    try {
      await deleteDictionaryEntry(kind, deleting.id)
      if (!active()) return
      await invalidateDictionaries(client)
      if (!active()) return
      setDeleting(null)
      toast.success({ title: 'Запись удалена' })
    } catch (cause) {
      if (active()) {
        setError(
          cause instanceof Error ? cause.message : 'Не удалось удалить запись.',
        )
        setDeleting(null)
      }
    } finally {
      saving.current = false
      if (active()) setPending(false)
    }
  }
  const data = (entries.data ?? []).filter((item) =>
    item.name
      .toLocaleLowerCase('ru')
      .includes(search.trim().toLocaleLowerCase('ru')),
  )
  if (!user) return null
  return (
    <Screen>
      <Header
        title={dictionaryLabels[kind]}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/admin')
        }
      />
      <Box className="gap-3 px-4 pb-3">
        <Input
          accessibilityLabel="Поиск по словарю"
          leadingIcon={Search}
          placeholder="Поиск по названию"
          value={search}
          onChangeText={setSearch}
        />
        {canEdit ? (
          <Button
            label="Добавить запись"
            icon={Plus}
            onPress={() => {
              setError('')
              setEditing('new')
            }}
          />
        ) : (
          <Text className="text-muted-foreground">Только просмотр</Text>
        )}
        {error ? (
          <Text accessibilityRole="alert" className="text-destructive-text">
            {error}
          </Text>
        ) : null}
      </Box>
      {entries.isPending ? (
        <LoadingView />
      ) : entries.isError ? (
        <ErrorState
          message={entries.error.message}
          onRetry={() => void entries.refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          // FlatList content container does not receive NativeWind classes.
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          refreshing={entries.isFetching}
          onRefresh={() => {
            void entries.refetch()
            if (parentKind) void parents.refetch()
          }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title={search ? 'Ничего не найдено' : 'Словарь пока пуст'}
            />
          }
          renderItem={({ item }) => (
            <Card>
              <Text bold className="text-card-foreground">
                {item.name}
              </Text>
              {parentKind ? (
                <Text size={FontSize.sm} className="text-muted-foreground">
                  {parents.data?.find(
                    (parent) =>
                      parent.id === (item.category_id ?? item.nutrient_type_id),
                  )?.name ??
                    (parents.isError
                      ? 'Не удалось загрузить группу'
                      : 'Группа недоступна')}
                </Text>
              ) : null}
              {canEdit ? (
                <Box className="flex-row justify-end gap-2">
                  <IconButton
                    size="icon"
                    variant="ghost"
                    className="min-h-12 min-w-12"
                    accessibilityLabel={`Редактировать ${item.name}`}
                    onPress={() => {
                      setError('')
                      setEditing(item)
                    }}
                  >
                    <ButtonIcon as={Pencil} />
                  </IconButton>
                  <IconButton
                    size="icon"
                    variant="ghost"
                    className="min-h-12 min-w-12"
                    accessibilityLabel={`Удалить ${item.name}`}
                    onPress={() => {
                      setError('')
                      setDeleting(item)
                    }}
                  >
                    <ButtonIcon as={Trash2} className="text-destructive-text" />
                  </IconButton>
                </Box>
              ) : null}
            </Card>
          )}
        />
      )}
      {editing && canEdit ? (
        <DictionaryDialog
          kind={kind}
          entry={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(deleting && canEdit)}
        title="Удалить запись?"
        description={`«${deleting?.name ?? ''}». Удаление возможно, только если запись не используется.`}
        confirmLabel="Удалить"
        isDestructive
        isLoading={pending}
        onConfirm={() => void remove()}
        onClose={() => {
          if (!pending) setDeleting(null)
        }}
      />
    </Screen>
  )
}

function DictionaryDialog({
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
  const save = async () => {
    if (saving.current || !active()) return
    setValidation(true)
    if (!name.trim() || (parentKind && !parentId)) return
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
              ? { nutrient_type_id: parentId }
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
              isDisabled={Boolean(parentKind && !parents.data)}
              onPress={() => void save()}
            />
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
