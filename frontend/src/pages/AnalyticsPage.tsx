/** Аналитика: метрики по дню публикации, время публикации, топ-пост, динамика по снимкам, посты. */
import { DynamicsCard } from '@/features/analytics/engagement/DynamicsCard'
import { PublicationDayCard } from '@/features/analytics/engagement/PublicationDayCard'
import { TopPostCard } from '@/features/analytics/overview/TopPostCard'
import { PostingTimeCard } from '@/features/analytics/posting-time/PostingTimeCard'
import { PostsTable } from '@/features/analytics/posts/PostsTable'

export default function AnalyticsPage() {
  return (
    <div className="page">
      <PublicationDayCard />
      <div className="grid grid--main-side">
        <PostingTimeCard />
        <TopPostCard />
      </div>
      <DynamicsCard />
      <PostsTable />
    </div>
  )
}
