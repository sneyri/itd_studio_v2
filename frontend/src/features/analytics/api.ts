/** Запросы аналитики и постов. Пользователь берётся из сессии — username в путях нет. */
import { api, toQuery } from '@/shared/api/client'
import type {
  DynamicsResponse,
  FollowersSeries,
  NewFollowersResponse,
  Overview,
  PostingTime,
  PostsPage,
  PostsSort,
  PublicationDaysResponse,
  WeekdaysResponse,
} from './types'

export const analyticsApi = {
  overview: () => api.get<Overview>('/analytics/overview'),
  followers: () => api.get<FollowersSeries>('/analytics/audience/followers'),
  newFollowers: (limit: number) => api.get<NewFollowersResponse>(`/analytics/audience/new-followers${toQuery({ limit })}`),
  publicationDays: () => api.get<PublicationDaysResponse>('/analytics/engagement/by-publication-date'),
  dynamics: () => api.get<DynamicsResponse>('/analytics/engagement/dynamics'),
  postingTime: () => api.get<PostingTime>('/analytics/posting-time'),
  weekdays: () => api.get<WeekdaysResponse>('/analytics/weekdays'),
  posts: (params: { limit: number; offset: number; sort: PostsSort }) => api.get<PostsPage>(`/posts${toQuery(params)}`),
}
