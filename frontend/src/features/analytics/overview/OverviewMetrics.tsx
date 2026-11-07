/** Сетка ключевых метрик дашборда: подписчики, лайки, просмотры, репосты + лучшее время. */
import { formatDecimal, formatNumber } from '@/shared/lib/format'
import { Card, ErrorState, IconEye, IconHeart, IconShare, IconUsers, InfoHint, MetricCard } from '@/shared/ui'
import { useOverview } from '../hooks'
import { BestTimeCard } from './BestTimeCard'

export function OverviewMetrics() {
  const { data, isPending, error, refetch } = useOverview()

  if (error) {
    return (
      <Card>
        <ErrorState error={error} onRetry={() => void refetch()} title="Не удалось загрузить сводку" />
      </Card>
    )
  }

  const loading = isPending
  const followersToday = data?.followers_today

  return (
    <div className="metrics-grid">
      <MetricCard
        loading={loading}
        icon={<IconUsers />}
        label="Подписчики"
        value={formatNumber(data?.followers_count)}
        aside={
          followersToday !== null && followersToday !== undefined ? (
            <>
              +{formatNumber(followersToday)}
              <br />
              сегодня
            </>
          ) : undefined
        }
      />
      <MetricCard
        loading={loading}
        icon={<IconHeart />}
        label={
          <>
            Лайки
            <InfoHint label="Что входит">
              Сумма лайков всех постов в базе. В среднем {formatDecimal(data?.avg_likes_per_post)} на пост.
            </InfoHint>
          </>
        }
        value={formatNumber(data?.total_likes)}
      />
      <MetricCard
        loading={loading}
        icon={<IconEye />}
        label={
          <>
            Просмотры
            <InfoHint label="Что входит">
              Сумма просмотров всех постов в базе. В среднем {formatDecimal(data?.avg_views_per_post)} на пост.
            </InfoHint>
          </>
        }
        value={formatNumber(data?.total_views)}
      />
      <MetricCard loading={loading} icon={<IconShare />} label="Репосты" value={formatNumber(data?.total_reposts)} />
      <BestTimeCard best={data?.best_posting_time} loading={loading} />
    </div>
  )
}
