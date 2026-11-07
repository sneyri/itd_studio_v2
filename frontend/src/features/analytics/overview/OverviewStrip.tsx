/** Строка-сводка над карточками: ER по просмотрам (с формулой), посты, подписки, комментарии. */
import { formatNumber, formatPercent } from '@/shared/lib/format'
import { Card, InfoHint, Skeleton } from '@/shared/ui'
import { useOverview } from '../hooks'

export function OverviewStrip() {
  const { data, isPending, isError } = useOverview()

  if (isPending) {
    return (
      <Card padding="md" className="overview-strip">
        <Skeleton width="min(420px, 100%)" height={16} />
      </Card>
    )
  }
  if (isError || !data) return null

  return (
    <Card padding="md" className="overview-strip" aria-label="Краткая сводка">
      <span className="overview-strip__item">
        ER по просмотрам: <strong>{formatPercent(data.engagement_rate)}</strong>
        <InfoHint label="Как считается ER">
          {data.engagement_rate_formula || '(лайки + комментарии + репосты) / просмотры'}. Считается по всем постам в
          локальной базе.
        </InfoHint>
      </span>
      <span className="overview-strip__sep" aria-hidden="true">
        ·
      </span>
      <span className="overview-strip__item">
        Постов: <strong>{formatNumber(data.posts_count)}</strong>
      </span>
      <span className="overview-strip__sep" aria-hidden="true">
        ·
      </span>
      <span className="overview-strip__item">
        Подписок: <strong>{formatNumber(data.following_count)}</strong>
      </span>
      <span className="overview-strip__sep" aria-hidden="true">
        ·
      </span>
      <span className="overview-strip__item">
        Комментариев: <strong>{formatNumber(data.total_comments)}</strong>
      </span>
    </Card>
  )
}
