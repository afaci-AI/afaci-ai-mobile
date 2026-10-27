import type { QueryClient } from '@tanstack/react-query'

import type {
  FlatProduct,
  Nutrient,
  Product,
  ProductFilters,
} from '@/modules/catalog/api'
import { ApiError, request, type RequestOptions } from '@/shared/api/client'

const errorMessages: Record<string, string> = {
  'Product already exists in this region':
    'Продукт с таким названием уже есть в выбранном регионе.',
  'Product already exists': 'Продукт с таким названием уже существует.',
  'Product not found': 'Продукт не найден. Возможно, он был удалён.',
  'Nutrient not found': 'Нутриент не найден. Обновите состав продукта.',
  'Nutrient name not found':
    'Название нутриента больше недоступно. Обновите список и выберите другое.',
  'NutrientName not found': 'Название нутриента не найдено. Обновите список.',
  'Unit not found': 'Единица измерения не найдена. Обновите список.',
  'Duplicate nutrient entry detected':
    'Этот нутриент уже есть в составе продукта. Измените существующую запись.',
}

/** Preserve status so 401/403 and missing records retain their normal semantics. */
async function adminRequest<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  try {
    return await request<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError) {
      const message =
        errorMessages[error.message] ??
        (error.status === 422
          ? 'Проверьте обязательные поля и выбранные значения справочников.'
          : error.message)
      throw new ApiError(message, error.status)
    }
    throw error
  }
}

export interface ProductInput {
  name: string
  category_id: string
  subcategory_id: string | null
  region_id: string
}

export interface AdminProductFilters extends ProductFilters {
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export function listAdminProducts(
  filters: AdminProductFilters,
  offset = 0,
  limit = 10,
) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    sort_by: filters.sort_by ?? 'product_name',
    sort_order: filters.sort_order ?? 'asc',
  })
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim()) params.set(key, value.trim())
  }
  return adminRequest<FlatProduct[]>(`/table/products?${params.toString()}`)
}

export function createProduct(input: ProductInput) {
  if (!input.region_id.trim()) throw new Error('Выберите регион.')
  return adminRequest<Product>('/products', { method: 'POST', body: input })
}

export function updateProduct(id: string, input: ProductInput) {
  if (!input.region_id.trim()) throw new Error('Выберите регион.')
  return adminRequest<Product>(`/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteProduct(id: string) {
  return adminRequest(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export interface NutrientInput {
  nutrient_name_id: string
  unit_id: string
  quantity: number
  error_rate: number | null
}

export function createNutrient(productId: string, input: NutrientInput) {
  return adminRequest<Nutrient>('/nutrients', {
    method: 'POST',
    body: { product_id: productId, ...input },
  })
}

export function updateNutrient(id: string, input: NutrientInput) {
  return adminRequest<Nutrient>(`/nutrients/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteNutrient(id: string) {
  return adminRequest(`/nutrients/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function invalidateAdminProducts(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['admin'] }),
    client.invalidateQueries({ queryKey: ['catalog'] }),
  ])
}
