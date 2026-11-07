/**
 * Единый QueryClient: повторы только для сетевых/серверных ошибок,
 * реакция на 401 — сброс сессии (RequireAuth перенаправит на /login).
 */
import { QueryClient } from '@tanstack/react-query'
import { ApiError, setUnauthorizedHandler } from '@/shared/api/client'
import { queryKeys } from '@/shared/api/queryKeys'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
        return failureCount < 2
      },
    },
    mutations: { retry: false },
  },
})

setUnauthorizedHandler(() => {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== queryKeys.me[0] })
  queryClient.setQueryData(queryKeys.me, null)
})
