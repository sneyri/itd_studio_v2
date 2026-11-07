/** Дашборд: сводка, ключевые метрики, рост подписчиков и активность по дням недели. */
import { FollowersGrowthCard } from '@/features/analytics/audience/FollowersGrowthCard'
import { WeekdayActivityCard } from '@/features/analytics/engagement/WeekdayActivityCard'
import { OverviewMetrics } from '@/features/analytics/overview/OverviewMetrics'
import { OverviewStrip } from '@/features/analytics/overview/OverviewStrip'

export default function DashboardPage() {
  return (
    <div className="page">
      <OverviewStrip />
      <OverviewMetrics />
      <div className="grid grid--main-side">
        <FollowersGrowthCard />
        <WeekdayActivityCard />
      </div>
    </div>
  )
}
