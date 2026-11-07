/** Запросы синхронизации: поставить задачу, узнать статус. Токен не передаётся — он на сервере. */
import { api } from '@/shared/api/client'
import type { SyncJob } from './types'

export function startSync(): Promise<SyncJob> {
  return api.post<SyncJob>('/sync')
}

export function fetchLatestJob(): Promise<SyncJob | null> {
  return api.get<SyncJob | null>('/sync/latest')
}

export function fetchJob(id: number): Promise<SyncJob> {
  return api.get<SyncJob>(`/sync/${id}`)
}
