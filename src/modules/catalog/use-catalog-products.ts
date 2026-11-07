import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  CATALOG_PAGE_SIZE,
  listProducts,
  type ProductFilters,
  useCatalogDictionaries,
} from './api'
import { ALL, countActiveFilters, useCatalogFilters } from './filters-store'

/**
 * Список продуктов для вкладки «База» и экрана поиска: один источник данных,
 * чтобы оба экрана показывали одинаковую выборку и один кеш страниц.
 */
export function useCatalogProducts() {
  const search = useCatalogFilters((state) => state.search)
  const categoryId = useCatalogFilters((state) => state.categoryId)
  const subcategoryId = useCatalogFilters((state) => state.subcategoryId)
  const regionId = useCatalogFilters((state) => state.regionId)
  const dictionaries = useCatalogDictionaries()

  // Справочники фильтруются на сервере по точным ID до пагинации, поэтому
  // список не нужно дофильтровывать и дозагружать на клиенте.
  const filters: ProductFilters = {
    product: search || undefined,
    category_id: categoryId === ALL ? undefined : categoryId,
    subcategory_id: subcategoryId === ALL ? undefined : subcategoryId,
    region_id: regionId === ALL ? undefined : regionId,
  }

  const query = useInfiniteQuery({
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
    return (query.data?.pages.flat() ?? []).filter((product) => {
      if (seen.has(product.product_id)) return false
      seen.add(product.product_id)
      return true
    })
  }, [query.data])

  const activeFilterCount = countActiveFilters({
    categoryId,
    subcategoryId,
    regionId,
  })

  function loadMore() {
    if (query.hasNextPage && !query.isFetching && !query.isError) {
      void query.fetchNextPage()
    }
  }

  return {
    query,
    dictionaries,
    rows,
    search,
    activeFilterCount,
    hasFilters: Boolean(search) || activeFilterCount > 0,
    loadMore,
  }
}

export { ALL }
