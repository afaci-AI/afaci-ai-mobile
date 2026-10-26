import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Bookmark, Pencil, Trash2, Search, Folder } from 'lucide-react-native'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { Pressable } from '@/shared/ui/pressable'
import type { RecipeGroup, SavedRecipe } from '@/modules/calculator/types'
import { errorMessage, matchesRecipeName } from './helpers'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { ScrollView } from '@/shared/ui/scroll-view'
import { Heading } from '@/shared/ui/heading'
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Input,
  Screen,
  Select,
  useAppToast,
} from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { savedApi } from './api'
import { RecipeDialog, type EditDialog } from './recipe-dialog'
import { RecipeMetrics } from './recipe-metrics'

type DeleteTarget = { kind: 'group' | 'recipe'; id: string; name: string }
export function SavedScreen() {
  const status = useSession((s) => s.status)
  const ownerId = useSession((s) => s.user?.id)
  const active = () =>
    useSession.getState().status === 'authenticated' &&
    useSession.getState().user?.id === ownerId
  const client = useQueryClient()
  const toast = useAppToast()
  const [filter, setFilter] = useState('__all__')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<EditDialog | null>(null)
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)
  const recipes = useQuery({
    queryKey: ['calculator', 'saved'],
    queryFn: savedApi.savedRecipes,
    enabled: status === 'authenticated',
  })
  const groups = useQuery({
    queryKey: ['calculator', 'groups'],
    queryFn: savedApi.groups,
    enabled: status === 'authenticated',
  })
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['calculator', 'saved'] }),
      client.invalidateQueries({ queryKey: ['calculator', 'groups'] }),
      client.invalidateQueries({ queryKey: ['saved', 'detail'] }),
    ])
  }
  const edit = useMutation({
    mutationFn: async (value: string) => {
      if (!dialog) return
      if (dialog.kind === 'create-group') {
        await savedApi.createGroup(value)
        return ownerId
      }
      await savedApi.renameGroup(dialog.id!, value)
      return ownerId
    },
    onSuccess: async (mutationOwner) => {
      if (!active() || mutationOwner !== useSession.getState().user?.id) return
      setDialog(null)
      await refresh()
      if (active()) toast.success({ title: 'Изменения сохранены' })
    },
  })
  const remove = useMutation({
    mutationFn: async () => {
      if (!deleting) return
      if (deleting.kind === 'group') await savedApi.deleteGroup(deleting.id)
      else await savedApi.deleteRecipe(deleting.id)
      return ownerId
    },
    onSuccess: async (mutationOwner) => {
      if (!active() || mutationOwner !== useSession.getState().user?.id) return
      if (deleting?.kind === 'group' && filter === deleting.id)
        setFilter('__all__')
      setDeleting(null)
      await refresh()
      if (active()) toast.success({ title: 'Удалено' })
    },
    onError: (error) =>
      active() &&
      toast.error({
        title: 'Не удалось удалить',
        description: errorMessage(error),
      }),
  })
  const openEdit = (next: EditDialog) => {
    edit.reset()
    setDialog(next)
  }
  if (status !== 'authenticated') return null
  const all = recipes.data ?? []
  const groupList = groups.data ?? []
  const selectedGroup = groupList.find((g) => g.id === filter)
  const grouped =
    filter === '__all__'
      ? all
      : all.filter((r) =>
          filter === '__none__' ? !r.group_id : r.group_id === filter,
        )
  const filtered = grouped.filter((recipe) =>
    matchesRecipeName(recipe.name, search),
  )
  return (
    <Screen edges={['top']}>
      <Header
        title="Рецептуры"
        subtitle="Сохранённые рецептуры и ранжирование"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="grow-0 shrink-0"
      >
        <Box className="flex-row gap-2 px-4 py-3">
          <Chip
            className="min-h-12"
            label="Ранжирование"
            onPress={() =>
              router.push({
                pathname: '/saved/ranking',
                params: { group: filter },
              })
            }
          />
          <Chip
            className="min-h-12"
            label="Оптимизация"
            onPress={() => router.push('/saved/optimization')}
          />
        </Box>
      </ScrollView>
      {recipes.isPending || groups.isPending ? (
        <LoadingView />
      ) : recipes.error || groups.error ? (
        <ErrorState
          message={errorMessage(recipes.error || groups.error)}
          onRetry={() => {
            void recipes.refetch()
            void groups.refetch()
          }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshing={recipes.isRefetching || groups.isRefetching}
          onRefresh={() => {
            void recipes.refetch()
            void groups.refetch()
          }}
          ListHeaderComponent={
            <VStack space="md">
              <Select
                leadingIcon={Folder}
                selectedTextSize="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: '__all__', label: `Все (${all.length})` },
                  {
                    value: '__none__',
                    label: `Без группы (${all.filter((r) => !r.group_id).length})`,
                  },
                  ...groupList.map((g) => ({
                    value: g.id,
                    label: `${g.name} (${all.filter((r) => r.group_id === g.id).length})`,
                  })),
                ]}
              />
              <Input
                leadingIcon={Search}
                accessibilityLabel="Поиск сохранённых рецептур по названию"
                placeholder="Поиск по названию"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                returnKeyType="search"
              />
              <Button
                label="Создать группу"
                variant="outline"
                onPress={() => openEdit({ kind: 'create-group' })}
              />
              {selectedGroup ? (
                <GroupActions
                  group={selectedGroup}
                  onRename={() =>
                    openEdit({
                      kind: 'rename-group',
                      id: selectedGroup.id,
                      name: selectedGroup.name,
                    })
                  }
                  onDelete={() =>
                    setDeleting({
                      kind: 'group',
                      id: selectedGroup.id,
                      name: selectedGroup.name,
                    })
                  }
                />
              ) : null}
            </VStack>
          }
          ListEmptyComponent={
            <EmptyState
              icon={Bookmark}
              title={
                search.trim() ? 'Рецептуры не найдены' : 'Рецептур пока нет'
              }
              description={
                search.trim()
                  ? 'Измените название или выберите другую группу.'
                  : 'Сохраните рецептуру в калькуляторе или выберите другую группу.'
              }
            />
          }
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              groupName={groupList.find((g) => g.id === item.group_id)?.name}
              onDelete={() =>
                setDeleting({ kind: 'recipe', id: item.id, name: item.name })
              }
            />
          )}
        />
      )}
      {dialog ? (
        <RecipeDialog
          key={`${dialog.kind}:${dialog.id ?? ''}`}
          dialog={dialog}
          pending={edit.isPending}
          error={edit.error ? errorMessage(edit.error) : undefined}
          onClose={() => {
            if (!edit.isPending) setDialog(null)
          }}
          onSubmit={(value) => edit.mutate(value)}
        />
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title={
          deleting?.kind === 'group' ? 'Удалить группу?' : 'Удалить рецептуру?'
        }
        description={
          deleting?.kind === 'group'
            ? `Группа «${deleting.name}» будет удалена. Рецептуры останутся в разделе «Без группы».`
            : `Рецептура «${deleting?.name ?? ''}» будет удалена без возможности восстановления.`
        }
        confirmLabel="Удалить"
        isDestructive
        isLoading={remove.isPending}
        onClose={() => {
          if (!remove.isPending) setDeleting(null)
        }}
        onConfirm={() => remove.mutate()}
      />
    </Screen>
  )
}
function GroupActions({
  group,
  onRename,
  onDelete,
}: {
  group: RecipeGroup
  onRename: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <VStack space="sm">
        <Heading size="sm" className="text-foreground">
          Группа «{group.name}»
        </Heading>
        <Button
          label="Переименовать группу"
          variant="outline"
          onPress={onRename}
        />
        <Button
          label="Удалить группу"
          variant="destructive"
          onPress={onDelete}
        />
      </VStack>
    </Card>
  )
}
function RecipeCard({
  recipe,
  groupName,
  onDelete,
}: {
  recipe: SavedRecipe
  groupName?: string
  onDelete: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Открыть рецептуру: ${recipe.name}`}
      onPress={() =>
        router.push({ pathname: '/saved/[id]', params: { id: recipe.id } })
      }
    >
      <Card>
        <VStack space="sm">
          <Box className="flex-row items-start gap-2">
            <Box className="flex-1 gap-1">
              <Heading size="md" className="text-foreground">
                {recipe.name}
              </Heading>
              <Text size="sm" className="text-muted-foreground">
                {groupName ?? 'Без группы'}
              </Text>
            </Box>
            <Box className="flex-row">
              <IconButton
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                accessibilityLabel={`Редактировать: ${recipe.name}`}
                onPress={(event) => {
                  event.stopPropagation()
                  router.push({
                    pathname: '/saved/[id]/edit',
                    params: { id: recipe.id },
                  })
                }}
              >
                <ButtonIcon as={Pencil} className="text-foreground" />
              </IconButton>
              <IconButton
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                accessibilityLabel={`Удалить: ${recipe.name}`}
                onPress={(event) => {
                  event.stopPropagation()
                  onDelete()
                }}
              >
                <ButtonIcon as={Trash2} className="text-destructive-text" />
              </IconButton>
            </Box>
          </Box>
          <RecipeMetrics recipe={recipe} />
        </VStack>
      </Card>
    </Pressable>
  )
}
