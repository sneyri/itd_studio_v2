/** Самый просматриваемый пост. */
import { useSession } from '@/features/auth/hooks'
import { formatDateTime, formatNumber, truncate } from '@/shared/lib/format'
import { ChartContainer, IconExternal } from '@/shared/ui'
import { useOverview } from '../hooks'
import { PostStats } from '../posts/PostStats'

export function TopPostCard() {
  const { data, isPending, error, refetch } = useOverview()
  const { profile } = useSession()
  const post = data?.top_post

  return (
    <ChartContainer
      title="Топ-пост по просмотрам"
      height={120}
      loading={isPending}
      error={error}
      onRetry={() => void refetch()}
      empty={!post ? { title: 'Постов пока нет', description: 'Синхронизируйте аккаунт, чтобы увидеть лучший пост.' } : null}
    >
      {post && (
        <div className="top-post">
          <p className="top-post__text">{post.content ? truncate(post.content, 280) : <em>Пост без текста</em>}</p>
          <div className="top-post__meta">
            <span>{formatDateTime(post.created_at, profile?.timezone)}</span>
            <a className="link" href={post.url} target="_blank" rel="noopener noreferrer">
              Открыть в итд <IconExternal size={14} />
            </a>
          </div>
          <PostStats post={post} />
          <p className="top-post__views">{formatNumber(post.views_count)} просмотров</p>
        </div>
      )}
    </ChartContainer>
  )
}
