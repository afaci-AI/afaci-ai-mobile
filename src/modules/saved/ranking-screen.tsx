import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'

import type { RecipeGroup, SavedRecipe } from '@/modules/calculator/types'
import { useSession } from '@/shared/session/store'
import { ErrorState, Header, LoadingView, Screen } from '@/shared/ui/kit'

import { savedApi } from './api'
import { errorMessage } from './helpers'
import { RankingPanel } from './ranking-panel'

export function RankingScreen() {
  const { group } = useLocalSearchParams<{ group?: string | string[] }>()
  const status = useSession((state) => state.status)
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
  if (status !== 'authenticated') return null
  return (
    <Screen>
      <Header
        title="Ранжирование"
        onBack={() => {
          if (router.canGoBack()) router.back()
          else router.replace('/(tabs)/saved')
        }}
      />
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
        <RankingContent
          recipes={recipes.data ?? []}
          groups={groups.data ?? []}
          initialGroup={Array.isArray(group) ? group[0] : group}
        />
      )}
    </Screen>
  )
}

function RankingContent({
  recipes,
  groups,
  initialGroup,
}: {
  recipes: SavedRecipe[]
  groups: RecipeGroup[]
  initialGroup?: string
}) {
  const validGroup = (value: string | undefined) =>
    value === '__none__' || groups.some((group) => group.id === value)
      ? value!
      : '__all__'
  const [filter, setFilter] = useState(() => validGroup(initialGroup))
  return (
    <RankingPanel
      recipes={recipes}
      groups={groups}
      groupFilter={validGroup(filter)}
      onGroupFilterChange={setFilter}
    />
  )
}
