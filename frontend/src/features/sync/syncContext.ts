/** Контекст состояния синхронизации (общий для кнопки в топбаре и баннера в контенте). */
import { createContext, useContext } from 'react'
import type { SyncJob } from './types'

export type SyncNoticeState =
  | { kind: 'cooldown'; retryAfter: number | null; message: string }
  | { kind: 'failed'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'done'; job: SyncJob }
  | null

export type SyncContextValue = {
  /** Текущая или последняя задача */
  job: SyncJob | null
  isRunning: boolean
  isStarting: boolean
  start: () => void
  notice: SyncNoticeState
  dismissNotice: () => void
}

export const SyncContext = createContext<SyncContextValue | null>(null)

export function useSyncStatus(): SyncContextValue {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSyncStatus должен вызываться внутри SyncProvider')
  return ctx
}
