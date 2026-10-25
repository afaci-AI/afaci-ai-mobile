import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api/client'

// These endpoints return untyped dictionaries in OpenAPI. Their wire shapes
// are verified against api/v1/products.py and infrastructure/db/models.
export interface DictionaryEntry {
  id: string
  name: string
}

export interface Subcategory extends DictionaryEntry {
  category_id: string | null
}

export interface NutrientName extends DictionaryEntry {
  nutrient_type_id: string | null
}

export interface Product extends DictionaryEntry {
  category_id: string
  subcategory_id: string | null
  region_id: string
}

export interface Nutrient {
  id: string
  product_id: string
  nutrient_name_id: string
  nutrient_type_id?: string | null
  unit_id: string
  quantity: number | null
  error_rate?: number | null
}

export interface FlatProduct {
  product_id: string
  product_name: string
  category_name: string
  subcategory_name: string | null
  region_name: string
}

export interface ProductFilters {
  product?: string
  category?: string
  subcategory?: string
  region?: string
}

export const CATALOG_PAGE_SIZE = 30

export function listProducts(
  filters: ProductFilters,
  offset = 0,
  limit = CATALOG_PAGE_SIZE,
): Promise<FlatProduct[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    sort_by: 'product_name',
    sort_order: 'asc',
  })
  // /table/products filters by names, rather than dictionary UUIDs.
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim()) params.set(key, value.trim())
  }
  return request(`/table/products?${params.toString()}`)
}

async function getCatalogDictionaries() {
  const [categories, subcategories, regions] = await Promise.all([
    request<DictionaryEntry[]>('/categories'),
    request<Subcategory[]>('/subcategories'),
    request<DictionaryEntry[]>('/regions'),
  ])
  return { categories, subcategories, regions }
}

export function useCatalogDictionaries() {
  return useQuery({
    queryKey: ['catalog', 'dictionaries'],
    queryFn: getCatalogDictionaries,
    staleTime: 5 * 60_000,
  })
}

export function useNutrientDictionaries() {
  return useQuery({
    queryKey: ['catalog', 'nutrient-dictionaries'],
    queryFn: async () => {
      const [names, types, units] = await Promise.all([
        request<NutrientName[]>('/nutrient-names'),
        request<DictionaryEntry[]>('/nutrient-types'),
        request<DictionaryEntry[]>('/units'),
      ])
      return { names, types, units }
    },
    staleTime: 5 * 60_000,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['catalog', 'product', id],
    queryFn: () => request<Product>(`/products/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  })
}

export function useProductNutrients(id: string) {
  return useQuery({
    queryKey: ['catalog', 'product-nutrients', id],
    queryFn: () =>
      request<Nutrient[]>(`/nutrients/product/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  })
}
