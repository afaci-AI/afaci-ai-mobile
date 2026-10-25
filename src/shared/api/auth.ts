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
}
