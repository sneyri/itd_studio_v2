/** Типы задачи синхронизации (docs/API.md → Sync). */
export type SyncStatus = 'queued' | 'running' | 'done' | 'failed'

export type SyncJob = {
  id: number
  status: SyncStatus
  created_at: string
  started_at: string | null
  finished_at: string | null
  posts_synced: number | null
  new_follow_events: number | null
  error: string | null
}

export function isActiveJob(job: SyncJob | null | undefined): job is SyncJob {
  return Boolean(job && (job.status === 'queued' || job.status === 'running'))
}
