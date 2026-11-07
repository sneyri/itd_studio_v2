/** Карточка «Рост подписчиков» с честной подписью источника данных. */
import { ChartContainer } from '@/shared/ui'
import { useFollowersSeries } from '../hooks'
import { FollowersChart } from './FollowersChart'
import { SourceBadges } from './SourceBadges'

type FollowersGrowthCardProps = {
  height?: number
  showDaily?: boolean
  title?: string
  className?: string
}

export function FollowersGrowthCard({ height = 260, showDaily = false, title = 'Рост подписчиков', className }: FollowersGrowthCardProps) {
  const { data, isPending, error, refetch } = useFollowersSeries()

  return (
    <ChartContainer
      className={className}
      title={title}
      subtitle={showDaily ? 'Линия — число подписчиков, столбики — новые подписки за день' : undefined}
      height={height}
      loading={isPending}
      error={error}
      onRetry={() => void refetch()}
      badges={data && data.points.length > 0 ? <SourceBadges series={data} /> : undefined}
      empty={
        data && data.points.length === 0
          ? {
              title: 'Истории подписчиков пока нет',
              description:
                'итд не хранит историю числа подписчиков. Ряд появится после второй синхронизации (снимки) или если в уведомлениях найдутся подписки.',
            }
          : null
      }
      footer={data?.note}
    >
      {data && <FollowersChart points={data.points} height={height} showDaily={showDaily} />}
    </ChartContainer>
  )
}
