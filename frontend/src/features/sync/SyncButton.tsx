/** Кнопка «Синхронизировать» для топбара + время последней синхронизации. */
import { useSession } from '@/features/auth/hooks'
import { formatDateTime, formatRelative } from '@/shared/lib/format'
import { Button, IconRefresh } from '@/shared/ui'
import { useSyncStatus } from './syncContext'

export function SyncButton() {
  const { isRunning, isStarting, start, job } = useSyncStatus()
  const { profile } = useSession()
  const lastSynced = profile?.last_synced_at ?? (job?.status === 'done' ? job.finished_at : null)
  const busy = isRunning || isStarting

  return (
    <div className="sync-control">
      <span className="sync-control__meta" title={lastSynced ? formatDateTime(lastSynced, profile?.timezone) : undefined}>
        {isRunning ? (job?.status === 'queued' ? 'В очереди…' : 'Синхронизация…') : `Обновлено ${formatRelative(lastSynced, profile?.timezone)}`}
      </span>
      <Button
        variant="ghost"
        onClick={start}
        loading={busy}
        icon={<IconRefresh size={18} />}
        aria-label="Синхронизировать данные с итд"
        className="sync-control__button"
      >
        <span className="sync-control__label">Синхронизировать</span>
      </Button>
    </div>
  )
}
