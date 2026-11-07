/** Запросы авторизации: вход по refresh_token (в теле, не в URL), выход, текущий профиль. */
import { api, ApiError } from '@/shared/api/client'
import type { Profile } from './types'

export function login(refreshToken: string): Promise<Profile> {
  return api.post<Profile>('/auth/login', { refresh_token: refreshToken }, { skipAuthRedirect: true })
}

export function logout(): Promise<void> {
  return api.post<void>('/auth/logout', undefined, { skipAuthRedirect: true })
}

/** Профиль текущей сессии или null, если сессии нет (401). */
export async function fetchMe(): Promise<Profile | null> {
  try {
    return await api.get<Profile>('/auth/me', { skipAuthRedirect: true })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
