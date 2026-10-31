import { Check, Trophy, Search, Folder } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'

import type { RecipeGroup, SavedRecipe } from '@/modules/calculator/types'
import { cn } from '@/shared/lib/cn'
import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { Heading } from '@/shared/ui/heading'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
} from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

import {
  rankRecipes,
  type RankedRecipe,
  type RankingResult,
} from './ranking-api'
import { matchesRecipeName } from './helpers'
import { FontSize } from '@/shared/theme/font-sizes'

interface RankingPanelProps {
  readonly recipes: SavedRecipe[]
  readonly groups: RecipeGroup[]
  readonly groupFilter: string
  readonly onGroupFilterChange: (value: string) => void
}

type Row =
  | { type: 'recipe'; key: string; recipe: SavedRecipe }
  | { type: 'section'; key: string; title: string; description?: string }
  | { type: 'winner' | 'bar' | 'metrics'; key: string; recipe: RankedRecipe }

/** A changed server snapshot discards selections and any in-flight result. */
export function RankingPanel(props: RankingPanelProps) {
  const snapshot = JSON.stringify([props.recipes, props.groups])
  return <RankingSelection key={snapshot} {...props} />
}

function RankingSelection({
  recipes,
  groups,
  groupFilter,
  onGroupFilterChange,
}: RankingPanelProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<RankingResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef(0)
  const mounted = useRef(true)
  const requestPending = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      generation.current += 1
    }
  }, [])

  // Matches the web's eligibility rule; drafts have no calculated BC.
  const calculated = recipes.filter((recipe) => recipe.metrics?.bc != null)
  const draftCount = recipes.length - calculated.length
  const grouped = calculated.filter(
    (recipe) =>
      groupFilter === '__all__' ||
      (groupFilter === '__none__'
        ? !recipe.group_id
        : recipe.group_id === groupFilter),
  )
  const visible = grouped.filter((recipe) =>
    matchesRecipeName(recipe.name, search),
  )
  const visibleIds = new Set(visible.map((recipe) => recipe.id))
  const allVisibleSelected =
    visible.length > 0 &&
    visible.every((recipe) => selected.includes(recipe.id))
  const hiddenSelectedCount = selected.filter(
    (id) => !visibleIds.has(id),
  ).length
  const changeSelection = (next: string[]) => {
    generation.current += 1
    setSelected(next)
    setResult(null)
    setError(null)
    setRunning(false)
    requestPending.current = false
  }

  const run = async () => {
    if (selected.length < 2 || requestPending.current) return
    const requestGeneration = ++generation.current
    requestPending.current = true
    setRunning(true)
    setResult(null)
    setError(null)
    try {
      const response = await rankRecipes(selected)
      if (mounted.current && generation.current === requestGeneration) {
        setResult(response)
      }
    } catch (cause) {
      if (mounted.current && generation.current === requestGeneration) {
        setError(cause instanceof Error ? cause.message : 'Повторите попытку.')
      }
    } finally {
      if (mounted.current && generation.current === requestGeneration) {
        requestPending.current = false
        setRunning(false)
      }
    }
  }

  const rows: Row[] = visible.map((recipe) => ({
    type: 'recipe',
    key: recipe.id,
    recipe,
  }))
  if (result) {
    const winner = result.ranking.find(
      (recipe) => recipe.recipe_id === result.winner,
    )
    if (winner) rows.push({ type: 'winner', key: 'winner', recipe: winner })
    rows.push({
      type: 'section',
      key: 'chart-heading',
      title: 'Композитный балл (0–100)',
      description:
        'Нормировка БЦ↑, КРАС↓, V↑, G↓ по выбранным рецептурам, равные веса.',
    })
    rows.push(
      ...result.ranking.map((recipe): Row => ({
        type: 'bar',
        key: `bar-${recipe.recipe_id}`,
        recipe,
      })),
    )
    rows.push({
      type: 'section',
      key: 'table-heading',
      title: 'От лучшей к худшей',
      description: 'Показатели сравнения. V — коэффициент утилитарности.',
    })
    rows.push(
      ...result.ranking.map((recipe): Row => ({
        type: 'metrics',
        key: `metrics-${recipe.recipe_id}`,
        recipe,
      })),
    )
  }

  return (
    <FlatList
      className="flex-1"
      data={rows}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(row) => row.key}
      contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
      ListHeaderComponent={
        <VStack space="md">
          <Select
            leadingIcon={Folder}
            selectedTextSize={FontSize.sm}
            value={groupFilter}
            onChange={(value) => {
              changeSelection([])
              onGroupFilterChange(value)
            }}
            options={[
              { value: '__all__', label: `Все (${calculated.length})` },
              {
                value: '__none__',
                label: `Без группы (${calculated.filter((recipe) => !recipe.group_id).length})`,
              },
              ...groups.map((group) => ({
                value: group.id,
                label: `${group.name} (${calculated.filter((recipe) => recipe.group_id === group.id).length})`,
              })),
            ]}
          />
          <Input
            leadingIcon={Search}
            accessibilityLabel="Поиск рецептур для ранжирования по названию"
            placeholder="Поиск по названию"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          <Text className="text-muted-foreground">
            Выберите минимум две рассчитанные рецептуры. Черновики ({draftCount}
            ) не участвуют.
          </Text>
          <Text className="text-foreground">
            Выбрано: {selected.length} из {grouped.length}. Найдено:{' '}
            {visible.length}.
          </Text>
          {hiddenSelectedCount > 0 ? (
            <Text size={FontSize.sm} className="text-muted-foreground">
              Скрыто фильтром или поиском: {hiddenSelectedCount} выбранных. Они
              тоже участвуют в ранжировании.
            </Text>
          ) : null}
          <Button
            label={
              allVisibleSelected
                ? 'Снять выделение найденных'
                : 'Выбрать все найденные'
            }
            variant="outline"
            isDisabled={visible.length === 0}
            onPress={() =>
              changeSelection(
                allVisibleSelected
                  ? selected.filter((id) => !visibleIds.has(id))
                  : [...new Set([...selected, ...visibleIds])],
              )
            }
          />
          {visible.length === 0 ? (
            <EmptyState
              title="Рецептуры не найдены"
              description="Измените название или выберите другую группу. Для ранжирования доступны только рассчитанные рецептуры."
            />
          ) : null}
          {calculated.length < 2 ? (
            <Text className="text-muted-foreground">
              Для ранжирования нужны минимум две рассчитанные рецептуры.
            </Text>
          ) : null}
          <Button
            label="Ранжировать рецептуры"
            disabled={selected.length < 2}
            isLoading={running}
            onPress={() => void run()}
          />
          {error ? (
            <ErrorState
              title="Ранжирование не выполнено"
              message={error}
              onRetry={() => void run()}
            />
          ) : null}
        </VStack>
      }
      renderItem={({ item }) => {
        if (item.type === 'section') {
          return (
            <VStack space="sm" className="pt-4">
              <Heading size={FontSize.md} className="text-foreground">
                {item.title}
              </Heading>
              {item.description ? (
                <Text size={FontSize.sm} className="text-muted-foreground">
                  {item.description}
                </Text>
              ) : null}
            </VStack>
          )
        }
        if (item.type === 'recipe') {
          const checked = selected.includes(item.recipe.id)
          const group = groups.find(
            (entry) => entry.id === item.recipe.group_id,
          )
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={item.recipe.name}
              accessibilityState={{ checked }}
              onPress={() =>
                changeSelection(
                  checked
                    ? selected.filter((id) => id !== item.recipe.id)
                    : [...selected, item.recipe.id],
                )
              }
              className={cn(
                'min-h-12 rounded-xl border p-4',
                checked ? 'border-primary bg-accent' : 'border-border bg-card',
              )}
            >
              <HStack space="md" className="items-center">
                <Box
                  className={cn(
                    'h-6 w-6 items-center justify-center rounded border',
                    checked
                      ? 'border-primary bg-primary'
                      : 'border-border bg-background',
                  )}
                >
                  {checked ? (
                    <Icon
                      as={Check}
                      size="sm"
                      className="text-primary-foreground"
                    />
                  ) : null}
                </Box>
                <VStack space="xs" className="flex-1">
                  <Text bold className="text-foreground">
                    {item.recipe.name}
                  </Text>
                  {group ? (
                    <Text size={FontSize.sm} className="text-muted-foreground">
                      {group.name}
                    </Text>
                  ) : null}
                  <Text size={FontSize.sm} className="text-muted-foreground">
                    БЦ {formatNumber(item.recipe.metrics.bc, 1)}% · КРАС{' '}
                    {formatNumber(item.recipe.metrics.kras, 1)}% · V{' '}
                    {formatNumber(item.recipe.metrics.V)} · G{' '}
                    {formatNumber(item.recipe.metrics.G)}
                  </Text>
                </VStack>
              </HStack>
            </Pressable>
          )
        }
        if (item.type === 'bar') {
          const score = Math.max(0, Math.min(100, item.recipe.composite * 100))
          return (
            <VStack space="xs">
              <Text size={FontSize.sm} className="text-foreground">
                {item.recipe.name} —{' '}
                {formatNumber(item.recipe.composite * 100, 0)}
              </Text>
              <Box
                className="h-4 overflow-hidden rounded-full bg-muted"
                accessibilityRole="progressbar"
                accessibilityLabel={`Композитный балл: ${item.recipe.name}`}
                accessibilityValue={{ min: 0, max: 100, now: score }}
              >
                {/* Dynamic width represents the server's score on a fixed 0–100 scale. */}
                <Box
                  className={cn(
                    'h-full rounded-full',
                    item.recipe.recipe_id === result?.winner
                      ? 'bg-primary'
                      : 'bg-chart-1',
                  )}
                  style={{ width: `${score}%` }}
                />
              </Box>
              <HStack className="justify-between">
                <Text size={FontSize.xs} className="text-muted-foreground">
                  0
                </Text>
                <Text size={FontSize.xs} className="text-muted-foreground">
                  100
                </Text>
              </HStack>
            </VStack>
          )
        }
        return (
          <RankingMetrics
            recipe={item.recipe}
            winner={item.type === 'winner'}
          />
        )
      }}
    />
  )
}

function RankingMetrics({
  recipe,
  winner,
}: {
  readonly recipe: RankedRecipe
  readonly winner: boolean
}) {
  return (
    <Card className={winner ? 'mt-4 border-primary bg-accent' : undefined}>
      {winner ? (
        <HStack space="sm" className="items-center">
          <Icon as={Trophy} className="text-primary" />
          <Heading size={FontSize.md} className="text-foreground">
            Лучшая рецептура
          </Heading>
        </HStack>
      ) : null}
      <Text bold className="text-foreground">
        {recipe.rank}. {recipe.name}
      </Text>
      {recipe.group ? (
        <Text size={FontSize.sm} className="text-muted-foreground">
          {recipe.group}
        </Text>
      ) : null}
      <HStack space="lg" className="flex-wrap">
        {[
          ['БЦ, %', formatNumber(recipe.bc, 1)],
          ['КРАС, %', formatNumber(recipe.kras, 1)],
          ['V', formatNumber(recipe.V)],
          ['G', formatNumber(recipe.G)],
          ['Балл', formatNumber(recipe.composite * 100, 0)],
        ].map(([label, value]) => (
          <VStack key={label} space="xs" className="min-w-16">
            <Text size={FontSize.sm} className="text-muted-foreground">
              {label}
            </Text>
            <Text bold className="text-foreground">
              {value}
            </Text>
          </VStack>
        ))}
      </HStack>
    </Card>
  )
}
