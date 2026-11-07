/**
 * Состояние синхронизации: POST /api/sync → опрос GET /api/sync/{id} каждые 2 с,
 * пока задача queued/running; по завершении инвалидирует все данные аналитики.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import { dataQueryRoots, queryKeys } from '@/shared/api/queryKeys'
import { SYNC_POLL_INTERVAL } from '@/shared/lib/constants'
import { fetchJob, fetchLatestJob, startSync } from './api'
import { SyncContext, type SyncNoticeState } from './syncContext'
import { isActiveJob, type SyncJob } from './types'

export function SyncProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [trackedId, setTrackedId] = useState<number | null>(null)
  const [notice, setNotice] = useState<SyncNoticeState>(null)
  const handled = useRef(new Set<number>())

  const latest = useQuery({ queryKey: queryKeys.syncLatest, queryFn: fetchLatestJob, staleTime: 30_000 })
  const activeId = trackedId ?? (isActiveJob(latest.data) ? latest.data.id : null)

  const onFinished = useCallback(
    (job: SyncJob) => {
      if (handled.current.has(job.id)) return
      handled.current.add(job.id)
      queryClient.setQueryData(queryKeys.syncLatest, job)
      if (job.status === 'done') {
        for (const key of dataQueryRoots) void queryClient.invalidateQueries({ queryKey: key })
        setNotice({ kind: 'done', job })
      } else {
        setNotice({ kind: 'failed', message: job.error ?? 'Синхронизация не удалась' })
      }
    },
    [queryClient],
  )

  const jobQuery = useQuery({
    queryKey: activeId !== null ? queryKeys.syncJob(activeId) : ['sync', 'job', 'none'],
    queryFn: async () => {
      const job = await fetchJob(activeId as number)
      if (!isActiveJob(job)) onFinished(job)
      return job
    },
    enabled: activeId !== null,
    refetchInterval: (query) => {
      const data = query.state.data as SyncJob | undefined
      return !data || isActiveJob(data) ? SYNC_POLL_INTERVAL : false
    },
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: startSync,
    onMutate: () => setNotice(null),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.syncJob(job.id), job)
      queryClient.setQueryData(queryKeys.syncLatest, job)
      setTrackedId(job.id)
      if (!isActiveJob(job)) onFinished(job)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'sync_cooldown') {
        setNotice({ kind: 'cooldown', retryAfter: error.retryAfter, message: error.message })
      } else {
        setNotice({ kind: 'error', message: error instanceof Error ? error.message : 'Не удалось запустить синхронизацию' })
      }
    },
  })

  const job = (activeId !== null ? jobQuery.data : undefined) ?? latest.data ?? null
  const isRunning = isActiveJob(job)
  const { mutate } = mutation

  const value = useMemo(
    () => ({
      job,
      isRunning,
      isStarting: mutation.isPending,
      start: () => mutate(),
      notice,
      dismissNotice: () => setNotice(null),
    }),
    [job, isRunning, mutation.isPending, mutate, notice],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}
