/** Баннер с результатом синхронизации: готово / кулдаун / ошибка. */
import { formatNumber, formatWait, plural } from '@/shared/lib/format'
import { IconAlert, IconClock, IconRefresh } from '@/shared/ui'
import { useSyncStatus } from './syncContext'

export function SyncNotice() {
  const { notice, dismissNotice } = useSyncStatus()
  if (!notice) return null

  let tone: 'success' | 'warning' | 'danger' = 'success'
  let icon = <IconRefresh size={18} />
  let text: string

  if (notice.kind === 'done') {
    const posts = notice.job.posts_synced ?? 0
    const follows = notice.job.new_follow_events ?? 0
    text = `Данные обновлены: ${formatNumber(posts)} ${plural(posts, ['пост', 'поста', 'постов'])}, ${formatNumber(follows)} ${plural(follows, ['новая подписка', 'новые подписки', 'новых подписок'])} из уведомлений.`
  } else if (notice.kind === 'cooldown') {
    tone = 'warning'
    icon = <IconClock size={18} />
    text = `Синхронизация будет доступна ${formatWait(notice.retryAfter)}. Частые обновления приводят к выходу из аккаунта итд.`
  } else {
    tone = 'danger'
    icon = <IconAlert size={18} />
    text = notice.kind === 'failed' ? `Синхронизация не удалась: ${notice.message}` : notice.message
  }

  return (
    <div className={`notice notice--${tone}`} role={tone === 'success' ? 'status' : 'alert'}>
      {icon}
      <span className="notice__text">{text}</span>
      <button type="button" className="notice__close" onClick={dismissNotice} aria-label="Скрыть уведомление">
        ×
      </button>
    </div>
  )
}
