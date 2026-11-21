import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'

import type { SavedRecipeDetail } from '@/features/calculator'
import { useSession } from '@/shared/session/store'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
  Select,
} from '@/shared/ui/kit'
import { Box } from '@/shared/ui/box'
import { ScrollView } from '@/shared/ui/scroll-view'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

import { savedApi } from './api'
import { errorMessage } from './helpers'
import {
  buildRequest,
  OptimizationForm,
  rowsFromRecipe,
} from './optimization-form'
import { OptimizationResult } from './optimization-result'
import type { OptimizationMode } from './optimization-types'

const EXPERIMENTAL_NOTE =
  'Экспериментальная функция: результат предварительный. Проверьте состав ' +
  'в калькуляторе и технологически перед применением.'

function ExperimentalNote() {
  return (
    <VStack space="xs">
      <Badge
        label="Экспериментальная"
        variant="outline"
        className="self-start"
      />
      <Text
        size={FontSize.sm}
        className="rounded-md border border-dashed border-border bg-muted p-2 text-muted-foreground"
      >
        {EXPERIMENTAL_NOTE}
      </Text>
    </VStack>
  )
}

/** Рецептура с названиями ингредиентов: старый backend их не присылает. */
async function recipeWithNames(id: string): Promise<SavedRecipeDetail> {
  const recipe = await savedApi.recipe(id)
  const items = await Promise.all(
    recipe.items.map(async (item) =>
      item.product_name
        ? item
        : {
            ...item,
            product_name: await savedApi
              .product(item.product_id)
              .then((product) => product.name)
              .catch(() => null),
          },
    ),
  )
  return { ...recipe, items }
}

function RecipeOptimizer({ recipeId }: { recipeId: string }) {
  const detail = useQuery({
    queryKey: ['saved', 'optimization', recipeId],
    queryFn: () => recipeWithNames(recipeId),
  })
  if (detail.isPending) return <LoadingView />
  if (detail.error)
    return (
      <ErrorState
        message={errorMessage(detail.error)}
        onRetry={() => void detail.refetch()}
      />
    )
  return <OptimizerForm recipe={detail.data} />
}

function OptimizerForm({ recipe }: { recipe: SavedRecipeDetail }) {
  const [mode, setMode] = useState<OptimizationMode>('basic')
  const [rows, setRows] = useState(() => rowsFromRecipe(recipe))
  const [inputError, setInputError] = useState<string>()
  const optimize = useMutation({ mutationFn: savedApi.optimizeRecipe })
  const names = useMemo(
    () => Object.fromEntries(rows.map((row) => [row.product_id, row.name])),
    [rows],
  )

  const run = () => {
    const body = buildRequest(mode, recipe.reference_protein_id, rows)
    if (typeof body === 'string') {
      setInputError(body)
      return
    }
    setInputError(undefined)
    optimize.mutate(body)
  }

  return (
    <VStack space="md">
      <OptimizationForm
        mode={mode}
        onModeChange={(value) => {
          setMode(value)
          optimize.reset()
        }}
        rows={rows}
        onRowChange={(index, patch) => {
          setRows((current) =>
            current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
          )
          optimize.reset()
        }}
      />
      {inputError || optimize.error ? (
        <Text className="text-destructive-text">
          {inputError ?? errorMessage(optimize.error)}
        </Text>
      ) : null}
      <Button
        label="Оптимизировать"
        isLoading={optimize.isPending}
        onPress={run}
      />
      {optimize.data ? (
        <OptimizationResult result={optimize.data} names={names} />
      ) : null}
    </VStack>
  )
}

/** Экспериментальная оптимизация сохранённой рецептуры на backend. */
export function OptimizationScreen() {
  const status = useSession((state) => state.status)
  const recipes = useQuery({
    queryKey: ['calculator', 'saved'],
    queryFn: savedApi.savedRecipes,
    enabled: status === 'authenticated',
  })
  const [recipeId, setRecipeId] = useState<string | null>(null)
  if (status !== 'authenticated') return null

  const options = (recipes.data ?? []).map((recipe) => ({
    label: recipe.name,
    value: recipe.id,
  }))

  return (
    <Screen>
      <Header
        title="Оптимизация"
        onBack={() => {
          if (router.canGoBack()) router.back()
          else router.replace('/(tabs)/saved')
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <ExperimentalNote />
        {recipes.isPending ? (
          <LoadingView />
        ) : recipes.error ? (
          <ErrorState
            message={errorMessage(recipes.error)}
            onRetry={() => void recipes.refetch()}
          />
        ) : options.length === 0 ? (
          <EmptyState
            title="Нет сохранённых рецептур."
            description="Сохраните рецептуру в калькуляторе, чтобы оптимизировать её."
          />
        ) : (
          <Box className="gap-4">
            <Select
              options={options}
              value={recipeId}
              onChange={setRecipeId}
              placeholder="Выберите рецептуру"
            />
            {recipeId ? (
              <RecipeOptimizer key={recipeId} recipeId={recipeId} />
            ) : null}
          </Box>
        )}
      </ScrollView>
    </Screen>
  )
}
