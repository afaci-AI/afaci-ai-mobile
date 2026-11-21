import { request } from './client'
import { normalizeUser, type LoginResponse, type User } from './models'

export const authApi = {
  async login(data: {
    email: string
    password: string
  }): Promise<LoginResponse> {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: data,
    })

    return {
      access_token: response.access_token,
      user: normalizeUser(response.user),
    }
  },

  async me(): Promise<User> {
    return normalizeUser(await request<User>('/auth/me'))
  },

  /** Ответ одинаков для известного и неизвестного адреса. */
  requestPasswordReset(email: string) {
    return request<{ status: string; message: string; resend_after?: number }>(
      '/auth/password-reset/request',
      { method: 'POST', authenticated: false, body: { email } },
    )
  },

  /** Проверка кода перед вводом пароля; код при этом не расходуется. */
  verifyPasswordReset(data: { email: string; code: string }) {
    return request<{ status: string }>('/auth/password-reset/verify', {
      method: 'POST',
      authenticated: false,
      body: data,
    })
  },

  confirmPasswordReset(data: {
    email: string
    code: string
    new_password: string
  }) {
    return request<{ status: string }>('/auth/password-reset/confirm', {
      method: 'POST',
      authenticated: false,
      body: data,
    })
  },
}
