import type { DocumentPickerAsset } from 'expo-document-picker'

import { API_BASE_URL, ApiError, request } from '@/shared/api/client'
import { useSession } from '@/shared/session/store'
import { getToken } from '@/shared/session/token'

export interface AppVersion {
  id: string
  version: string
  versionCode: number
  apkUrl: string
  apkFilename: string
  changelog: string | null
  forceUpdate: boolean
  minSupportedVersionCode: number | null
  isCurrent: boolean
  publishedAt: string
}
export interface VersionInput {
  version: string
  changelog: string
  forceUpdate: boolean
  minSupportedVersionCode: number | null
}
export const versionsKey = ['admin', 'app-versions'] as const
export const listVersions = () => request<AppVersion[]>('/admin/app-versions')
export const createVersion = (
  body: VersionInput & {
    versionCode: number
    apkFilename: string
    isCurrent: boolean
  },
) => request<AppVersion>('/admin/app-versions', { method: 'POST', body })
export const updateVersion = (id: string, body: VersionInput) =>
  request<AppVersion>(`/admin/app-versions/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
  })
export const setCurrentVersion = (id: string) =>
  request<AppVersion>(`/admin/app-versions/${encodeURIComponent(id)}/current`, {
    method: 'PATCH',
  })
export const deleteVersion = (id: string) =>
  request(`/admin/app-versions/${encodeURIComponent(id)}`, { method: 'DELETE' })

export function apkUrl(value: string) {
  const url = new URL(value, `${API_BASE_URL}/`)
  if (!['https:', 'http:'].includes(url.protocol))
    throw new Error('Недопустимая ссылка APK.')
  return url.toString()
}

export interface UploadedApk {
  filename: string
  url: string
  size: number
}
export const MAX_APK_SIZE = 200 * 1024 * 1024

/** XHR uses the native multipart transport and reports upload progress without
 * reading a 200 MB APK into JavaScript memory. Do not set the multipart boundary. */
export function uploadApk(
  file: DocumentPickerAsset,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
): Promise<UploadedApk> {
  if (!file.name.toLowerCase().endsWith('.apk'))
    return Promise.reject(new Error('Выберите файл с расширением .apk.'))
  if (!file.size || file.size > MAX_APK_SIZE)
    return Promise.reject(
      new Error(
        'Выберите непустой APK размером до 200 МБ с доступной информацией о размере.',
      ),
    )
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const token = getToken()
    const abort = () => xhr.abort()
    const cleanup = () => signal.removeEventListener('abort', abort)
    xhr.open('POST', `${API_BASE_URL}/api/v1/admin/app-versions/upload-apk`)
    xhr.timeout = 10 * 60 * 1000
    xhr.setRequestHeader('Accept', 'application/json')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = ({ lengthComputable, loaded, total }) => {
      if (lengthComputable && total > 0)
        onProgress(Math.min(100, Math.round((loaded / total) * 100)))
    }
    xhr.onerror = () => {
      cleanup()
      reject(
        new ApiError(
          'Не удалось загрузить APK. Проверьте соединение и повторите.',
          0,
        ),
      )
    }
    xhr.ontimeout = () => {
      cleanup()
      reject(new ApiError('Время загрузки APK истекло. Повторите попытку.', 0))
    }
    xhr.onabort = () => {
      cleanup()
      reject(new Error('Загрузка отменена.'))
    }
    xhr.onload = () => {
      cleanup()
      let body: unknown
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        body = null
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = body as UploadedApk | null
        if (!result?.filename || !result.url || !result.size) {
          reject(new Error('Сервер вернул некорректный ответ загрузки.'))
          return
        }
        onProgress(100)
        resolve(result)
      } else {
        if (xhr.status === 401 && token && getToken() === token)
          void useSession
            .getState()
            .logout()
            .catch(() => undefined)
        const detail = (body as { detail?: unknown } | null)?.detail
        reject(
          new ApiError(
            typeof detail === 'string'
              ? detail
              : `Ошибка загрузки APK (${xhr.status}).`,
            xhr.status,
          ),
        )
      }
    }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      cleanup()
      reject(new Error('Загрузка отменена.'))
      return
    }
    const data = new FormData()
    // React Native accepts a URI descriptor; the DOM FormData type only knows Blob.
    data.append('file', {
      uri: file.uri,
      name: file.name,
      type: 'application/vnd.android.package-archive',
    } as unknown as Blob)
    xhr.send(data)
  })
}
