/** Хуки сессии: useSession (кто вошёл), useLogin, useLogout. Сессия — только httpOnly cookie. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { queryKeys } from '@/shared/api/queryKeys'
import { startSync } from '@/features/sync/api'
import { fetchMe, login, logout } from './api'

export function useSession() {
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    staleTime: 60_000,
  })
  return {
    profile: query.data ?? null,
    isLoading: query.isPending,
    isAuthenticated: Boolean(query.data),
    error: query.error,
    refetch: query.refetch,
  }
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: login,
    onSuccess: async (profile) => {
      queryClient.setQueryData(queryKeys.me, profile)
      // Сразу после входа запускаем синхронизацию; кулдаун (429) здесь не ошибка.
      try {
        const job = await startSync()
        queryClient.setQueryData(queryKeys.syncLatest, job)
      } catch {
        await queryClient.invalidateQueries({ queryKey: queryKeys.syncLatest })
      }
      navigate('/', { replace: true })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
      queryClient.setQueryData(queryKeys.me, null)
      navigate('/login', { replace: true })
    },
  })
}
