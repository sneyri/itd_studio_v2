/** Бейджи происхождения ряда подписчиков: снимки / восстановлено по уведомлениям. */
import { formatDayLong } from '@/shared/lib/format'
import { Badge } from '@/shared/ui'
import type { FollowersSeries } from '../types'

export function SourceBadges({ series }: { series: FollowersSeries }) {
  const hasSnapshots = series.points.some((p) => p.source === 'snapshot')
  const hasRestored = series.points.some((p) => p.source === 'notifications')
  return (
    <>
      {hasSnapshots && (
        <Badge tone="success" title="Значение записано во время синхронизации">
          <span className="legend-dot legend-dot--solid" aria-hidden="true" />
          Реальные снимки{series.snapshots_since ? ` с ${formatDayLong(series.snapshots_since.slice(0, 10))}` : ''}
        </Badge>
      )}
      {hasRestored && (
        <Badge tone="warning" title="Посчитано назад от текущего числа подписчиков по датам подписок из уведомлений">
          <span className="legend-dot legend-dot--hollow" aria-hidden="true" />
          Восстановлено по уведомлениям, без учёта отписок
        </Badge>
      )}
    </>
  )
}
