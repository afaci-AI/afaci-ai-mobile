import Constants from 'expo-constants'

import type { AppVersionInfo } from './api'

export type UpdateKind = 'none' | 'optional' | 'required'

/** versionCode установленной сборки (из app.config.ts, вшит в APK). */
export function installedVersionCode(): number | null {
  const code = Constants.expoConfig?.android?.versionCode
  return typeof code === 'number' ? code : null
}

/**
 * Нужна ли установка новой версии. Обязательная — если сервер требует
 * обновление или установленная сборка ниже минимально поддерживаемой.
 */
export function updateKind(
  info: AppVersionInfo | null | undefined,
  installed: number | null,
): UpdateKind {
  if (!info || installed === null || info.versionCode <= installed) {
    return 'none'
  }
  const belowMinimum =
    info.minSupportedVersionCode !== null &&
    installed < info.minSupportedVersionCode
  return info.forceUpdate || belowMinimum ? 'required' : 'optional'
}

/** Changelog приходит одной строкой: каждый пункт «•» — с новой строки. */
export function formatChangelog(changelog: string | null): string | null {
  const text = changelog?.trim()
  if (!text) return null
  return text.replace(/\s*•\s*/g, '\n• ').trim()
}
