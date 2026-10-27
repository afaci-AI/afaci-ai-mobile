import type { QueryClient } from '@tanstack/react-query'

import { ApiError, request, type RequestOptions } from '@/shared/api/client'

export const dictionaryLabels = {
  categories: 'Категории',
  subcategories: 'Подкатегории',
  regions: 'Регионы',
  units: 'Единицы измерения',
  'nutrient-types': 'Типы нутриентов',
  'nutrient-names': 'Названия нутриентов',
} as const
export type DictionaryKind = keyof typeof dictionaryLabels
export interface AdminDictionaryEntry {
  id: string
  name: string
  category_id?: string
  nutrient_type_id?: string
}
export interface DictionaryInput {
  name: string
  category_id?: string
  nutrient_type_id?: string
}
export function isDictionaryKind(value: string): value is DictionaryKind {
  return Object.hasOwn(dictionaryLabels, value)
}
async function dictionaryRequest<T>(path: string, options?: RequestOptions) {
  try {
    return await request<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError) {
      const message = /already exists/i.test(error.message)
        ? 'Запись с таким названием уже существует в выбранной группе.'
        : /Cannot delete|used in/i.test(error.message)
          ? 'Запись используется в других данных. Сначала измените связанные записи.'
          : /not found/i.test(error.message)
            ? 'Запись или выбранная группа больше недоступна. Обновите список.'
            : error.status === 422
              ? 'Проверьте название и выбранную группу.'
              : error.message
      throw new ApiError(message, error.status)
    }
    throw error
  }
}
export const listDictionary = (kind: DictionaryKind) =>
  dictionaryRequest<AdminDictionaryEntry[]>(`/${kind}`)
export function saveDictionaryEntry(
  kind: DictionaryKind,
  input: DictionaryInput,
  id?: string,
) {
  return dictionaryRequest<AdminDictionaryEntry>(
    `/${kind}${id ? `/${encodeURIComponent(id)}` : ''}`,
    {
      method: id ? 'PATCH' : 'POST',
      body: input,
    },
  )
}
export function deleteDictionaryEntry(kind: DictionaryKind, id: string) {
  return dictionaryRequest(`/${kind}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
export async function invalidateDictionaries(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['admin'] }),
    client.invalidateQueries({ queryKey: ['catalog'] }),
  ])
}
