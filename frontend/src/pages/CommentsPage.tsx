/** Комментарии: сводные цифры, последние комментарии из уведомлений, самые обсуждаемые посты. */
import { useOverview } from '@/features/analytics/hooks'
import { RecentComments } from '@/features/comments/RecentComments'
import { TopCommentedPosts } from '@/features/comments/TopCommentedPosts'
import { formatDecimal, formatNumber } from '@/shared/lib/format'
import { IconComments, IconMessage, MetricCard } from '@/shared/ui'

export default function CommentsPage() {
  const { data, isPending } = useOverview()
  return (
    <div className="page">
      <div className="metrics-grid metrics-grid--2">
        <MetricCard loading={isPending} icon={<IconComments />} label="Всего комментариев" value={formatNumber(data?.total_comments)} />
        <MetricCard
          loading={isPending}
          icon={<IconMessage />}
          label="В среднем на пост"
          value={formatDecimal(data?.avg_comments_per_post, 2)}
        />
      </div>
      <div className="grid grid--main-side">
        <RecentComments />
        <TopCommentedPosts />
      </div>
    </div>
  )
}
