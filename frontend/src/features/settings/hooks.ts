/** Хуки настроек: чтение и сохранение часового пояса (с пересчётом аналитики). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/queryKeys'
import { settingsApi } from './api'

export const useSettings = () => useQuery({ queryKey: queryKeys.settings, queryFn: settingsApi.get })

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings)
      // часовой пояс влияет на дни/часы во всей аналитике
      void queryClient.invalidateQueries({ queryKey: queryKeys.analytics })
      void queryClient.invalidateQueries({ queryKey: queryKeys.me })
      void queryClient.invalidateQueries({ queryKey: queryKeys.comments })
    },
  })
}
