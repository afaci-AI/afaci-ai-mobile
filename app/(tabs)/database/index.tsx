import { router } from 'expo-router'
import { Package, Search, SlidersHorizontal } from 'lucide-react-native'
import { useState } from 'react'

import { ProductGrid } from '@/modules/catalog/components/product-grid'
import { useCatalogFilters } from '@/modules/catalog/filters-store'
import { useCatalogProducts } from '@/modules/catalog/use-catalog-products'
import { Box } from '@/shared/ui/box'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import {
  Button,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
} from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

export default function DatabaseScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const reset = useCatalogFilters((state) => state.reset)
  const {
    query,
    dictionaries,
    rows,
    search,
    activeFilterCount,
    hasFilters,
    loadMore,
  } = useCatalogProducts()

  async function refresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.allSettled([query.refetch(), dictionaries.refetch()])
    } finally {
      setRefreshing(false)
    }
  }

  const header = (
    <VStack space="md" className="px-4 py-4">
      <HStack space="sm" className="items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Поиск продуктов питания"
          onPress={() => router.push('/database/search')}
          className="min-h-12 flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-background px-4 data-[active=true]:bg-muted"
        >
          <Icon as={Search} size="md" className="text-muted-foreground" />
          <Text
            numberOfLines={1}
            className={
              search ? 'flex-1 text-foreground' : 'flex-1 text-muted-foreground'
            }
          >
            {search || 'Поиск продуктов питания'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount
              ? `Фильтры, выбрано: ${activeFilterCount}`
              : 'Фильтры'
          }
          onPress={() => router.push('/database/filters')}
          className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-background data-[active=true]:bg-muted"
        >
          <Icon as={SlidersHorizontal} size="md" className="text-foreground" />
          {activeFilterCount ? (
            <Box className="absolute right-1 top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
              <Text size="xs" className="text-primary-foreground">
                {activeFilterCount}
              </Text>
            </Box>
          ) : null}
        </Pressable>
      </HStack>

      {hasFilters ? (
        <HStack space="sm" className="items-center">
          <Text size="sm" className="flex-1 text-muted-foreground">
            {activeFilterCount
              ? `Фильтров выбрано: ${activeFilterCount}`
              : 'Поиск по названию'}
          </Text>
          <Button
            label="Сбросить"
            variant="ghost"
            className="min-h-10"
            onPress={reset}
          />
        </HStack>
      ) : null}

      {query.isRefetchError && !query.isFetchNextPageError && rows.length ? (
        <ErrorState
          title="Не удалось обновить список"
          message={query.error?.message}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isPending && !query.isError ? (
        <Text
          size="sm"
          className="text-muted-foreground"
          accessibilityLiveRegion="polite"
        >
          Загружено продуктов: {rows.length}
        </Text>
      ) : null}
    </VStack>
  )

  return (
    <Screen edges={['top']}>
      <Header
        title="База продуктов"
        subtitle="Состав продуктов по регионам Кыргызстана"
      />
      <ProductGrid
        rows={rows}
        query={query}
        header={header}
        onEndReached={loadMore}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        empty={
          query.isPending ? (
            <LoadingView fullscreen={false} label="Ищем продукты…" />
          ) : query.isError ? (
            <Box className="px-4">
              <ErrorState
                message={query.error?.message}
                onRetry={() => void query.refetch()}
              />
            </Box>
          ) : (
            <EmptyState
              icon={Package}
              title="Продукты не найдены"
              description="Попробуйте другое название или сбросьте фильтры."
              action={
                hasFilters ? (
                  <Button
                    label="Сбросить фильтры"
                    variant="outline"
                    className="min-h-12"
                    onPress={reset}
                  />
                ) : undefined
              }
            />
          )
        }
      />
    </Screen>
  )
}
