/** Запросы комментариев: последние из уведомлений итд и топ постов по комментариям. */
import { api, toQuery } from '@/shared/api/client'
import type { RecentCommentsResponse, TopCommentedResponse } from './types'

export const commentsApi = {
  recent: (limit: number) => api.get<RecentCommentsResponse>(`/comments/recent${toQuery({ limit })}`),
  topPosts: (limit: number) => api.get<TopCommentedResponse>(`/comments/top-posts${toQuery({ limit })}`),
}
