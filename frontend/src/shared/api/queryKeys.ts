/**
 * Ключи TanStack Query в одном месте, чтобы инвалидация после синхронизации
 * гарантированно задевала все зависящие от данных запросы.
 */
export const queryKeys = {
  me: ['me'] as const,
  settings: ['settings'] as const,
  syncLatest: ['sync', 'latest'] as const,
  syncJob: (id: number) => ['sync', 'job', id] as const,
  analytics: ['analytics'] as const,
  overview: ['analytics', 'overview'] as const,
  followers: ['analytics', 'followers'] as const,
  newFollowers: (limit: number) => ['analytics', 'new-followers', limit] as const,
  publicationDays: ['analytics', 'publication-days'] as const,
  dynamics: ['analytics', 'dynamics'] as const,
  postingTime: ['analytics', 'posting-time'] as const,
  weekdays: ['analytics', 'weekdays'] as const,
  posts: ['posts'] as const,
  postsPage: (params: { limit: number; offset: number; sort: string }) => ['posts', params] as const,
  comments: ['comments'] as const,
  recentComments: (limit: number) => ['comments', 'recent', limit] as const,
  topCommented: (limit: number) => ['comments', 'top-posts', limit] as const,
}

/** Всё, что зависит от синхронизированных данных. */
export const dataQueryRoots = [queryKeys.me, queryKeys.analytics, queryKeys.posts, queryKeys.comments, queryKeys.settings]
