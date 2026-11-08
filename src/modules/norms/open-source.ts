import { Linking } from 'react-native'

import { API_BASE_URL } from '@/shared/api/client'

import type { Source } from './types'

/** Адрес для открытия источника: приложенный файл, иначе внешняя ссылка. */
export function sourceUrl(source: Source): string | undefined {
  return source.pdf_url?.trim() || source.url?.trim() || undefined
}

/** Открывает источник во внешнем приложении; false — открыть не удалось. */
export async function openSource(source: Source): Promise<boolean> {
  const target = sourceUrl(source)
  if (!target) return false
  try {
    const url = new URL(target, `${API_BASE_URL}/`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    if (!(await Linking.canOpenURL(url.href))) return false
    await Linking.openURL(url.href)
    return true
  } catch {
    return false
  }
}
