import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import type { RecipeGroup, SavedRecipeDetail } from '@/modules/calculator/types'
import { useSession } from '@/shared/session/store'
import {
  Button,
  ErrorState,
  FormField,
  Header,
  Input,
  LoadingView,
  ScrollScreen,
  Select,
  useAppToast,
} from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { savedApi } from './api'
import { errorMessage } from './helpers'

export function RecipeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const status = useSession((s) => s.status)
  const detail = useQuery({
    queryKey: ['saved', 'detail', id],
    queryFn: () => savedApi.recipe(id),
    enabled: status === 'authenticated' && Boolean(id),
  })
  const groups = useQuery({
    queryKey: ['calculator', 'groups'],
    queryFn: savedApi.groups,
    enabled: status === 'authenticated',
  })
  if (status !== 'authenticated') return null
  const back = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/saved')
  }
  return (
    <ScrollScreen>
      <Header title="Редактировать рецептуру" onBack={back} />
      {detail.isPending || groups.isPending ? (
        <LoadingView fullscreen={false} />
      ) : detail.error || groups.error ? (
        <ErrorState
          message={errorMessage(detail.error || groups.error)}
          onRetry={() => {
            void detail.refetch()
            void groups.refetch()
          }}
        />
      ) : detail.data ? (
        <RecipeEditForm
          key={detail.data.id}
          recipe={detail.data}
          groups={groups.data ?? []}
          onBack={back}
        />
      ) : null}
    </ScrollScreen>
  )
}

function RecipeEditForm({
  recipe,
  groups,
  onBack,
}: {
  recipe: SavedRecipeDetail
  groups: RecipeGroup[]
  onBack: () => void
}) {
  const [name, setName] = useState(recipe.name)
  const [groupId, setGroupId] = useState(recipe.group_id ?? '__none__')
  const [validation, setValidation] = useState('')
  const ownerId = useSession((s) => s.user?.id)
  const client = useQueryClient()
  const toast = useAppToast()
  const active = () =>
    useSession.getState().status === 'authenticated' &&
    useSession.getState().user?.id === ownerId
  const save = useMutation({
    mutationFn: async () => {
      await savedApi.updateRecipe(recipe.id, {
        name: name.trim(),
        group_id: groupId === '__none__' ? null : groupId,
      })
      return ownerId
    },
    onSuccess: async (mutationOwner) => {
      if (!active() || mutationOwner !== useSession.getState().user?.id) return
      await Promise.all([
        client.invalidateQueries({ queryKey: ['calculator', 'saved'] }),
        client.invalidateQueries({ queryKey: ['calculator', 'groups'] }),
        client.invalidateQueries({ queryKey: ['saved', 'detail', recipe.id] }),
      ])
      if (active()) {
        toast.success({ title: 'Рецептура сохранена' })
        onBack()
      }
    },
  })
  return (
    <VStack space="lg">
      <FormField label="Название" isRequired>
        <Input
          accessibilityLabel="Название рецептуры"
          value={name}
          onChangeText={setName}
          isDisabled={save.isPending}
          maxLength={200}
        />
      </FormField>
      <FormField label="Группа">
        <Select
          value={groupId}
          onChange={setGroupId}
          isDisabled={save.isPending}
          options={[
            { value: '__none__', label: 'Без группы' },
            ...groups.map((group) => ({ value: group.id, label: group.name })),
          ]}
        />
      </FormField>
      {validation || save.error ? (
        <Text accessibilityRole="alert" className="text-destructive-text">
          {validation || errorMessage(save.error)}
        </Text>
      ) : null}
      <Button
        label="Сохранить"
        isLoading={save.isPending}
        onPress={() => {
          if (!name.trim()) {
            setValidation('Укажите название рецептуры.')
            return
          }
          setValidation('')
          save.mutate()
        }}
      />
      <Button
        label="Редактировать в калькуляторе"
        variant="outline"
        isDisabled={save.isPending}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/calculator',
            params: { edit: recipe.id },
          })
        }
      />
      <Text size="sm" className="text-muted-foreground">
        Сначала сохраните изменения названия и группы. Состав и массы
        редактируются в калькуляторе.
      </Text>
    </VStack>
  )
}
