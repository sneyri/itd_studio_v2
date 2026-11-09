/** Хуки уведомлений: бесконечный список (offset-пагинация), сводка, поиск авторов. */
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { notificationsApi } from './api'
import type { NotificationFilters } from './types'

export const NOTIFICATIONS_PAGE_SIZE = 30

export const useNotifications = (filters: NotificationFilters) =>
  useInfiniteQuery({
    queryKey: queryKeys.notificationsList(filters),
    queryFn: ({ pageParam, signal }) => notificationsApi.list(filters, NOTIFICATIONS_PAGE_SIZE, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.offset + last.items.length
      return last.items.length > 0 && next < last.total ? next : undefined
    },
    placeholderData: keepPreviousData,
  })

export const useNotificationsSummary = () =>
  useQuery({ queryKey: queryKeys.notificationsSummary, queryFn: notificationsApi.summary })

export const useNotificationActors = (q: string) =>
  useQuery({
    queryKey: queryKeys.notificationActors(q),
    queryFn: () => notificationsApi.actors(q),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
