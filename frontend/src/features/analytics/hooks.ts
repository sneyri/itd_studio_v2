/** Хуки загрузки аналитики через TanStack Query (кэш, повторы, состояния). */
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { analyticsApi } from './api'
import type { PostsSort } from './types'

export const useOverview = () => useQuery({ queryKey: queryKeys.overview, queryFn: analyticsApi.overview })

export const useFollowersSeries = () => useQuery({ queryKey: queryKeys.followers, queryFn: analyticsApi.followers })

export const useNewFollowers = (limit = 20) =>
  useQuery({ queryKey: queryKeys.newFollowers(limit), queryFn: () => analyticsApi.newFollowers(limit) })

export const usePublicationDays = () => useQuery({ queryKey: queryKeys.publicationDays, queryFn: analyticsApi.publicationDays })

export const useDynamics = () => useQuery({ queryKey: queryKeys.dynamics, queryFn: analyticsApi.dynamics })

export const usePostingTime = () => useQuery({ queryKey: queryKeys.postingTime, queryFn: analyticsApi.postingTime })

export const useWeekdays = () => useQuery({ queryKey: queryKeys.weekdays, queryFn: analyticsApi.weekdays })

export const usePosts = (params: { limit: number; offset: number; sort: PostsSort }) =>
  useQuery({
    queryKey: queryKeys.postsPage(params),
    queryFn: () => analyticsApi.posts(params),
    placeholderData: keepPreviousData,
  })
