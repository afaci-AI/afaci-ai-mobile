import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

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

  const categories = dictionaries.data?.categories ?? []
  const subcategories = dictionaries.data?.subcategories ?? []
  const regions = dictionaries.data?.regions ?? []
  const categoryName = categories.find((item) => item.id === categoryId)?.name
  const subcategoryName = subcategories.find(
    (item) => item.id === subcategoryId,
  )?.name
  const regionName = regions.find((item) => item.id === regionId)?.name

  const filters: ProductFilters = {
    product: search || undefined,
    // The flat-table endpoint filters names (ILIKE), not dictionary IDs.
    category: categoryName,
    subcategory: subcategoryName,
    region: regionName,
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
  }, [query.data, categoryName, subcategoryName, regionName])

  // A whole page may consist of near-matches dropped above, so keep paging
  // while nothing exact is visible yet.
  useEffect(() => {
    if (
      rows.length === 0 &&
      query.hasNextPage &&
      !query.isFetching &&
      !query.isError
    ) {
      void query.fetchNextPage()
    }
  }, [rows.length, query])

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
