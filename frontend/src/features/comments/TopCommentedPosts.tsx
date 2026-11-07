/** Посты с наибольшим числом комментариев. */
import { useSession } from '@/features/auth/hooks'
import { PostStats } from '@/features/analytics/posts/PostStats'
import { formatDate, formatNumber, truncate } from '@/shared/lib/format'
import { Card, EmptyState, ErrorState, IconExternal, Skeleton } from '@/shared/ui'
import { useTopCommentedPosts } from './hooks'

export function TopCommentedPosts({ limit = 10 }: { limit?: number }) {
  const { data, isPending, error, refetch } = useTopCommentedPosts(limit)
  const { profile } = useSession()
  const items = data?.items.filter((p) => p.comments_count > 0) ?? []

  return (
    <Card className="list-card">
      <header className="list-card__header">
        <h2 className="chart-card__title">Самые обсуждаемые посты</h2>
        <p className="chart-card__subtitle">По числу комментариев на момент синхронизации</p>
      </header>
      {isPending ? (
        <div className="skeleton-lines">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height={56} radius="var(--radius-md)" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : items.length === 0 ? (
        <EmptyState compact title="Комментариев пока нет" description="Ни у одного поста в базе нет комментариев." />
      ) : (
        <ol className="rank-list">
          {items.map((post, index) => (
            <li key={post.id} className="rank-list__item">
              <span className="rank-list__index">{index + 1}</span>
              <div className="rank-list__body">
                <a className="posts-table__link" href={post.url} target="_blank" rel="noopener noreferrer">
                  {post.content ? truncate(post.content, 120) : <em className="muted">Без текста</em>}
                  <IconExternal size={13} />
                </a>
                <div className="rank-list__meta">
                  <span>{formatDate(post.created_at, profile?.timezone)}</span>
                  <PostStats post={post} />
                </div>
              </div>
              <span className="rank-list__value" title="Комментариев">
                {formatNumber(post.comments_count)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
