/** Типы уведомлений (контракт API v2.1 → /api/notifications). */
import type { Post } from '@/features/analytics/types'

export type NotificationType =
  | 'like'
  | 'comment'
  | 'reply'
  | 'repost'
  | 'follow'
  | 'follow_request'
  | 'follow_accepted'
  | 'comment_reaction'
  | 'comment_mention'
  | 'mention'
  | 'wall_post'

export type NotificationActor = {
  id: string | null
  username: string | null
  display_name: string | null
  avatar: string | null
  /** null — статус неизвестен (итд не отдал, человека нет в списке подписчиков) */
  is_verified: boolean | null
}

export type NotificationItem = {
  id: string
  /** строка, потому что итд может добавить новые типы */
  type: string
  created_at: string
  is_read: boolean | null
  preview: string | null
  actor: NotificationActor
  post: Post | null
  target_id: string | null
}

export type NotificationsPage = { items: NotificationItem[]; total: number; limit: number; offset: number }

export type NotificationsSummary = {
  total: number
  unread: number
  since: string | null
  by_type: { type: string; count: number }[]
  verified: { verified: number; not_verified: number; unknown: number }
  top_actors: {
    username: string
    display_name: string | null
    avatar: string | null
    is_verified: boolean | null
    count: number
  }[]
  by_day: { date: string; count: number }[]
}

export type NotificationActorOption = {
  username: string
  display_name: string | null
  avatar: string | null
  is_verified: boolean | null
  count: number
}

export type NotificationActorsResponse = { items: NotificationActorOption[] }

export type NotificationsSort = 'new' | 'old' | 'actor'
export type VerifiedFilter = '' | 'true' | 'false'

/** Состояние фильтров (хранится в URL). Пустая строка = фильтр не задан. */
export type NotificationFilters = {
  types: string[]
  actor: string
  verified: VerifiedFilter
  unread: boolean
  q: string
  date_from: string
  date_to: string
  sort: NotificationsSort
}
