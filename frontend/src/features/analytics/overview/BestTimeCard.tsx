/** Карточка «Лучшее время» публикации; при малой выборке честно показывает причину. */
import { formatNumber } from '@/shared/lib/format'
import { IconClock, InfoHint, MetricCard } from '@/shared/ui'
import type { BestPostingTime } from '../types'

export function BestTimeCard({ best, loading }: { best: BestPostingTime | undefined; loading: boolean }) {
  const sufficient = Boolean(best?.sufficient_data && best.label)
  return (
    <MetricCard
      loading={loading}
      icon={<IconClock />}
      label={
        <>
          Лучшее время
          {best && (
            <InfoHint label="Как выбирается">
              Час публикации с наибольшими средними просмотрами среди часов, где достаточно постов. Часовой пояс:{' '}
              {best.timezone}.{best.sample_posts ? ` Постов в этом часе: ${best.sample_posts}.` : ''}
            </InfoHint>
          )}
        </>
      }
      value={sufficient ? best?.label : '—'}
      hint={
        sufficient
          ? `~${formatNumber(best?.avg_views)} просм. / ~${formatNumber(best?.avg_interactions)} взаим.`
          : (best?.reason ?? 'Недостаточно данных')
      }
    />
  )
}
