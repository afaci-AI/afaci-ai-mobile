import { ApiError, API_BASE_URL, request } from '@/shared/api/client'

/** Ответ `GET /app/version`: текущая опубликованная версия приложения. */
export interface AppVersionInfo {
  version: string
  versionCode: number
  apkUrl: string
  changelog: string | null
  forceUpdate: boolean
  minSupportedVersionCode: number | null
}

/** Текущая версия или `null`, если на сервере ещё ничего не опубликовано. */
export async function fetchAppVersion(): Promise<AppVersionInfo | null> {
  try {
    return await request<AppVersionInfo>('/app/version', {
      authenticated: false,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/** Абсолютная ссылка на APK: backend отдаёт путь от корня сайта. */
export function resolveApkUrl(apkUrl: string): string {
  return new URL(apkUrl, `${API_BASE_URL}/`).href
}
