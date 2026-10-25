import { useInfiniteQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { Package, SlidersHorizontal } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
// Android's hardware Back is a native integration, not a layout primitive.
import { BackHandler } from 'react-native'

import {
  CATALOG_PAGE_SIZE,
  listProducts,
  type ProductFilters,
  useCatalogDictionaries,
} from '@/modules/catalog/api'
import { ProductListCard } from '@/modules/catalog/components/product-list-card'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { HStack } from '@/shared/ui/hstack'
import {
  Button,
  EmptyState,
  ErrorState,
  FormField,
  Header,
  Input,
  LoadingView,
  Screen,
  Select,
} from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

const ALL = '__all__'

export default function DatabaseScreen() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState(ALL)
  const [subcategoryId, setSubcategoryId] = useState(ALL)
  const [regionId, setRegionId] = useState(ALL)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const dictionaries = useCatalogDictionaries()

  useFocusEffect(
    useCallback(() => {
      if (!filtersOpen) return
      const listener = BackHandler.addEventListener('hardwareBackPress', () => {
        setFiltersOpen(false)
        return true
      })
      return () => listener.remove()
    }, [filtersOpen]),
  )

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(timeout)
  }, [search])

  const categories = dictionaries.data?.categories ?? []
  const subcategories = dictionaries.data?.subcategories ?? []
  const regions = dictionaries.data?.regions ?? []
  const categoryName = categories.find((item) => item.id === categoryId)?.name
  const subcategoryName = subcategories.find(
    (item) => item.id === subcategoryId,
  )?.name
  const regionName = regions.find((item) => item.id === regionId)?.name
  const filters: ProductFilters = {
    product: debouncedSearch || undefined,
    // The flat-table endpoint filters names (ILIKE), not dictionary IDs.
    category: categoryName,
    subcategory: subcategoryName,
    region: regionName,
  }

  const products = useInfiniteQuery({
    queryKey: ['catalog', 'products', filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => listProducts(filters, pageParam),
    getNextPageParam: (lastPage, _pages, lastOffset) =>
      lastPage.length === CATALOG_PAGE_SIZE
        ? lastOffset + lastPage.length
        : undefined,
  })

  const rows = useMemo(() => {
    const seen = new Set<string>()
    return (products.data?.pages.flat() ?? []).filter((product) => {
      if (seen.has(product.product_id)) return false
      // Dictionary filters are substring matches on the server, so «Мясо»
      // also returns «Мясо птицы». Keep only exact dictionary hits, so the
      // selection matches the web catalog.
      if (categoryName && product.category_name !== categoryName) return false
      if (subcategoryName && product.subcategory_name !== subcategoryName)
        return false
      if (regionName && product.region_name !== regionName) return false
      seen.add(product.product_id)
      return true
    })
  }, [products.data, categoryName, subcategoryName, regionName])

  // A whole page may consist of near-matches dropped above, so keep paging
  // while nothing exact is visible yet.
  useEffect(() => {
    if (
      rows.length === 0 &&
      products.hasNextPage &&
      !products.isFetching &&
      !products.isError
    ) {
      void products.fetchNextPage()
    }
  }, [rows.length, products])

  const activeFilterCount = [categoryId, subcategoryId, regionId].filter(
    (value) => value !== ALL,
  ).length
  const hasFilters = Boolean(search) || activeFilterCount > 0
  const searchPending = search.trim() !== debouncedSearch
  const subcategoryOptions =
    categoryId === ALL
      ? subcategories
      : subcategories.filter((item) => item.category_id === categoryId)

  function resetFilters() {
    setSearch('')
    setDebouncedSearch('')
    setCategoryId(ALL)
    setSubcategoryId(ALL)
    setRegionId(ALL)
  }

  async function refresh() {
    if (refreshing) return
    setRefreshing(true)
    try {
      await Promise.allSettled([products.refetch(), dictionaries.refetch()])
    } finally {
      setRefreshing(false)
    }
  }

  const header = (
    <VStack space="lg" className="px-4 py-4">
      <FormField label="Поиск продукта">
        <Input
          accessibilityLabel="Поиск по названию продукта"
          placeholder="Например, молоко"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </FormField>

      <HStack space="sm" className="flex-wrap">
        <Button
          label={
            activeFilterCount ? `Фильтры: ${activeFilterCount}` : 'Фильтры'
          }
          icon={SlidersHorizontal}
          variant="outline"
          className="min-h-12"
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => setFiltersOpen(!filtersOpen)}
        />
        {hasFilters ? (
          <Button
            label="Сбросить"
            variant="ghost"
            className="min-h-12"
            onPress={resetFilters}
          />
        ) : null}
      </HStack>

      {filtersOpen ? (
        dictionaries.isPending ? (
          <LoadingView fullscreen={false} label="Загрузка фильтров…" />
        ) : dictionaries.isError ? (
          <ErrorState
            title="Не удалось загрузить фильтры"
            message={dictionaries.error.message}
            onRetry={() => void dictionaries.refetch()}
          />
        ) : (
          <VStack space="md">
            <FormField label="Категория">
              <Select
                value={categoryId}
                onChange={(value) => {
                  setCategoryId(value)
                  setSubcategoryId(ALL)
                }}
                placeholder="Все категории"
                options={[
                  { value: ALL, label: 'Все категории' },
                  ...categories.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
            <FormField label="Подкатегория">
              <Select
                value={subcategoryId}
                onChange={setSubcategoryId}
                placeholder="Все подкатегории"
                isDisabled={subcategoryOptions.length === 0}
                options={[
                  { value: ALL, label: 'Все подкатегории' },
                  ...subcategoryOptions.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
            <FormField label="Регион">
              <Select
                value={regionId}
                onChange={setRegionId}
                placeholder="Все регионы"
                options={[
                  { value: ALL, label: 'Все регионы' },
                  ...regions.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
          </VStack>
        )
      ) : null}

      {searchPending ? (
        <Text
          size="sm"
          className="text-muted-foreground"
          accessibilityLiveRegion="polite"
        >
          Обновляем поиск…
        </Text>
      ) : null}

      {products.isRefetchError &&
      !products.isFetchNextPageError &&
      rows.length ? (
        <ErrorState
          title="Не удалось обновить список"
          message={products.error.message}
          onRetry={() => void products.refetch()}
        />
      ) : null}

      {!products.isPending && !products.isError && !searchPending ? (
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
      <FlatList
        data={rows}
        keyExtractor={(item) => item.product_id}
        renderItem={({ item }) => <ProductListCard product={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          products.isPending || searchPending ? (
            <LoadingView fullscreen={false} label="Ищем продукты…" />
          ) : products.isError ? (
            <ErrorState
              message={products.error.message}
              onRetry={() => void products.refetch()}
            />
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
                    onPress={resetFilters}
                  />
                ) : undefined
              }
            />
          )
        }
        ListFooterComponent={
          products.isFetchingNextPage ? (
            <LoadingView fullscreen={false} label="Загружаем ещё…" />
          ) : products.isFetchNextPageError ? (
            <ErrorState
              title="Не удалось загрузить следующую страницу"
              message={products.error.message}
              onRetry={() => void products.fetchNextPage()}
            />
          ) : products.hasNextPage && !products.isError ? (
            <Box className="px-4 pb-6">
              <Button
                label="Загрузить ещё"
                variant="outline"
                className="min-h-12"
                disabled={products.isFetching || searchPending}
                onPress={() => void products.fetchNextPage()}
              />
            </Box>
          ) : (
            <Box className="h-6" />
          )
        }
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        onEndReached={() => {
          if (
            products.hasNextPage &&
            !products.isFetching &&
            !products.isError &&
            !searchPending
          ) {
            void products.fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </Screen>
  )
}
