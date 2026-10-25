import { create } from 'zustand'

import { authApi } from '@/shared/api/auth'
import { ApiError, setUnauthorizedHandler } from '@/shared/api/client'
import type { User } from '@/shared/api/models'
import { queryClient } from '@/shared/api/query-client'

import { clearToken, loadToken, saveToken } from './token'

export type SessionStatus = 'loading' | 'authenticated' | 'guest' | 'error'

interface SessionState {
  status: SessionStatus
  user: User | null
  bootstrapError: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// Ответ старого запроса не должен восстанавливать уже закрытую сессию.
let revision = 0
let bootstrapTask: Promise<void> | null = null
let pendingTokenRemoval = false

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  user: null,
  bootstrapError: null,

  bootstrap() {
    if (bootstrapTask) return bootstrapTask
    const currentRevision = ++revision
    set({ status: 'loading', user: null, bootstrapError: null })

    const task = async () => {
      try {
        // После сбоя logout повторяем удаление, а не восстанавливаем старый JWT.
        if (pendingTokenRemoval) {
          await clearToken()
          if (currentRevision !== revision) return
          pendingTokenRemoval = false
        }
        const token = await loadToken()
        if (currentRevision !== revision) return
        if (!token) {
          set({ status: 'guest', user: null })
          return
        }

        const user = await authApi.me()
        if (currentRevision === revision) {
          set({ status: 'authenticated', user })
        }
      } catch (error) {
        if (currentRevision !== revision) return
        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          await get()
            .logout()
            .catch(() => undefined)
          return
        }

        // Сеть, 5xx и недоступное хранилище — повод повторить, не удалять JWT.
        set({
          status: 'error',
          user: null,
          bootstrapError:
            error instanceof Error
              ? error.message
              : 'Не удалось восстановить сессию. Попробуйте ещё раз.',
        })
      }
    }

    bootstrapTask = task().finally(() => {
      bootstrapTask = null
    })
    return bootstrapTask
  },

  async login(email, password) {
    const currentRevision = ++revision
    const response = await authApi.login({ email: email.trim(), password })
    if (currentRevision !== revision) return
    await saveToken(response.access_token)
    if (currentRevision !== revision) return
    pendingTokenRemoval = false
    queryClient.clear()
    set({ status: 'authenticated', user: response.user, bootstrapError: null })
  },

  async logout() {
    const currentRevision = ++revision
    pendingTokenRemoval = true
    // Закрываем доступ сразу, не ждём медленное нативное хранилище.
    const clearing = clearToken()
    queryClient.clear()
    set({ status: 'loading', user: null, bootstrapError: null })
    try {
      await clearing
      if (currentRevision !== revision) return
      pendingTokenRemoval = false
      set({ status: 'guest' })
    } catch (error) {
      if (currentRevision === revision) {
        set({
          status: 'error',
          bootstrapError:
            'Не удалось удалить сохранённый вход. Повторите выход.',
        })
      }
      throw error
    }
  },
}))

setUnauthorizedHandler(() => {
  // logout сам показывает восстановление после ошибки удаления SecureStore.
  void useSession
    .getState()
    .logout()
    .catch(() => undefined)
})
