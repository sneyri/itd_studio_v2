/** Хуки загрузки комментариев. */
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { commentsApi } from './api'

export const useRecentComments = (limit = 30) =>
  useQuery({ queryKey: queryKeys.recentComments(limit), queryFn: () => commentsApi.recent(limit) })

export const useTopCommentedPosts = (limit = 10) =>
  useQuery({ queryKey: queryKeys.topCommented(limit), queryFn: () => commentsApi.topPosts(limit) })
