/** Аудитория: подписчики (снимки + уведомления), новые подписчики и честный список недоступных данных. */
import { FollowersGrowthCard } from '@/features/analytics/audience/FollowersGrowthCard'
import { MissingDataCard } from '@/features/analytics/audience/MissingDataCard'
import { NewFollowersList } from '@/features/analytics/audience/NewFollowersList'
import { useOverview } from '@/features/analytics/hooks'
import { formatNumber } from '@/shared/lib/format'
import { IconUsers, MetricCard } from '@/shared/ui'

export default function AudiencePage() {
  const { data, isPending } = useOverview()
  const today = data?.followers_today

  return (
    <div className="page">
      <div className="metrics-grid metrics-grid--3">
        <MetricCard loading={isPending} icon={<IconUsers />} label="Подписчики" value={formatNumber(data?.followers_count)} />
        <MetricCard loading={isPending} icon={<IconUsers />} label="Подписки" value={formatNumber(data?.following_count)} />
        <MetricCard
          loading={isPending}
          icon={<IconUsers />}
          label="Новых сегодня"
          value={today === null || today === undefined ? '—' : `+${formatNumber(today)}`}
          hint={today === null || today === undefined ? 'Нет данных из уведомлений' : 'По уведомлениям о подписке'}
        />
      </div>
      <FollowersGrowthCard title="Подписчики" height={340} showDaily />
      <div className="grid grid--halves">
        <NewFollowersList />
        <MissingDataCard />
      </div>
    </div>
  )
}
