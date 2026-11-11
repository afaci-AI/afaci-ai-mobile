import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { FlatList } from '@/shared/ui/flat-list'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Header,
  Input,
  LoadingView,
  Screen,
  useAppToast,
} from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import {
  deleteDictionaryEntry,
  dictionaryLabels,
  invalidateDictionaries,
  isDictionaryKind,
  listDictionary,
  type AdminDictionaryEntry,
  type DictionaryKind,
} from './dictionaries-api'
import { FontSize } from '@/shared/theme/font-sizes'
import { DictionaryDialog } from './dictionary-dialog'

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
  // Единица нутриента показывается в списке рядом с типом.
  const units = useQuery({
    queryKey: ['admin', 'dictionary', 'units'],
    queryFn: () => listDictionary('units'),
    enabled: Boolean(user && kind === 'nutrient-names'),
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
            if (kind === 'nutrient-names') void units.refetch()
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
              {kind === 'nutrient-names' ? (
                <Text size={FontSize.sm} className="text-muted-foreground">
                  {`Единица: ${
                    units.data?.find((unit) => unit.id === item.unit_id)
                      ?.name ??
                    (item.unit_id
                      ? units.isError
                        ? 'не удалось загрузить'
                        : 'недоступна'
                      : 'не задана')
                  }`}
                </Text>
              ) : null}
              {canEdit ? (
                <Box className="flex-row justify-end gap-2">
                  <IconButton
                    size="icon"
                    variant="outline"
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
                    variant="outline"
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
