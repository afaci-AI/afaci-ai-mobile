import { getToken } from '@/shared/session/token'

/** Dev-стенд по умолчанию; переопределяется через `EXPO_PUBLIC_API_URL`. */
const DEFAULT_BASE_URL = 'https://api.foodcraftsl.lab'
const REQUEST_TIMEOUT_MS = 20_000

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_BASE_URL
).replace(/\/+$/, '')

export class ApiError extends Error {
  /** HTTP-статус или 0, если запрос не дошёл до сервера. */
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Реакция на 401 в запросе, который шёл с токеном: сессия недействительна,
 * нужно разлогинить. Регистрируется из session-стора, чтобы клиент не зависел
 * от него напрямую.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  /** Вход выполняется без токена старой сессии. */
  authenticated?: boolean
}

function extractMessage(body: unknown, status: number): string {
  if (typeof body === 'string' && body.trim()) return body

  if (body && typeof body === 'object') {
    const detail = (body as { detail?: unknown }).detail

    if (typeof detail === 'string' && detail.trim()) return detail

    // Ошибки валидации FastAPI: detail — массив {loc, msg, type}.
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object' && 'msg' in item) {
            const message = (item as { msg?: unknown }).msg
            return typeof message === 'string' ? message : null
          }
          return null
        })
        .filter((message): message is string => Boolean(message))

      if (messages.length > 0) return messages.join('\n')
    }

    const message = (body as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }

  if (status === 401) return 'Требуется вход в систему.'
  if (status === 403) return 'Недостаточно прав для этого действия.'
  if (status === 404) return 'Запись не найдена.'
  if (status >= 500) return 'Ошибка сервера. Попробуйте позже.'
  return `Ошибка запроса (${status}).`
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const token = options.authenticated === false ? null : getToken()
  const hasBody = options.body !== undefined

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await parseBody(response)

      // 401 на запросе с токеном — сессия истекла. На самом логине токена нет,
      // поэтому неверный пароль не приводит к ложному разлогину.
      if (response.status === 401 && token && getToken() === token) {
        unauthorizedHandler?.()
      }

      throw new ApiError(extractMessage(body, response.status), response.status)
    }

    if (response.status === 204) return undefined as T
    return (await parseBody(response)) as T
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (__DEV__) {
      console.warn('[api] request failed', path, error)
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        'Сервер не ответил вовремя. Проверьте соединение и повторите.',
        0,
      )
    }

    throw new ApiError('Нет соединения с сервером. Проверьте интернет.', 0)
  } finally {
    clearTimeout(timeoutId)
  }
}
