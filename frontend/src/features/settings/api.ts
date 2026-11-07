/** Настройки пользователя на сервере (сейчас — часовой пояс для аналитики). */
import { api } from '@/shared/api/client'

export type UserSettings = { timezone: string }

export const settingsApi = {
  get: () => api.get<UserSettings>('/settings'),
  update: (settings: UserSettings) => api.put<UserSettings>('/settings', settings),
}
