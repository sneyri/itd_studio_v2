/** Запросы уведомлений: список с фильтрами, сводка, авторы для фильтра «от пользователя». */
import { api, toQuery } from '@/shared/api/client'
import type {
  NotificationActorsResponse,
  NotificationFilters,
  NotificationsPage,
  NotificationsSummary,
} from './types'

/** Фильтры → query string. types повторяется: ?types=like&types=follow */
export function notificationsQuery(filters: NotificationFilters, limit: number, offset: number): string {
  const base = toQuery({
    actor: filters.actor,
    verified: filters.verified,
    unread: filters.unread ? 'true' : undefined,
    q: filters.q.trim(),
    date_from: filters.date_from,
    date_to: filters.date_to,
    sort: filters.sort,
    limit,
    offset,
  })
  const search = new URLSearchParams(base.slice(1))
  for (const type of filters.types) search.append('types', type)
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const notificationsApi = {
  list: (filters: NotificationFilters, limit: number, offset: number, signal?: AbortSignal) =>
    api.get<NotificationsPage>(`/notifications${notificationsQuery(filters, limit, offset)}`, { signal }),
  summary: () => api.get<NotificationsSummary>('/notifications/summary'),
  actors: (q: string, limit = 20) => api.get<NotificationActorsResponse>(`/notifications/actors${toQuery({ q, limit })}`),
}
