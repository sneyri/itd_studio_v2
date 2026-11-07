/** Лента последних комментариев к постам пользователя (по уведомлениям итд). */
import { useSession } from '@/features/auth/hooks'
import { formatDate, formatDateTime, formatRelative } from '@/shared/lib/format'
import { Avatar, Badge, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { useRecentComments } from './hooks'
import type { CommentEventType } from './types'

const TYPE_LABEL: Record<CommentEventType, string> = {
  comment: 'комментарий',
  reply: 'ответ',
  comment_mention: 'упоминание',
}

export function RecentComments({ limit = 30 }: { limit?: number }) {
  const { data, isPending, error, refetch } = useRecentComments(limit)
  const { profile } = useSession()

  return (
    <Card className="list-card">
      <header className="list-card__header">
        <h2 className="chart-card__title">Последние комментарии</h2>
        <p className="chart-card__subtitle">
          Из уведомлений итд{data?.since ? ` · история доступна с ${formatDate(data.since, profile?.timezone)}` : ''}
        </p>
      </header>

      {isPending ? (
        <ul className="comment-list">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="comment-list__item">
              <Skeleton width={38} height={38} radius="50%" />
              <div className="comment-list__body">
                <Skeleton width="40%" />
                <Skeleton width="90%" />
              </div>
            </li>
          ))}
        </ul>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          compact
          title="Комментариев в уведомлениях нет"
          description="итд хранит ограниченную историю уведомлений. Новые комментарии появятся здесь после следующей синхронизации."
        />
      ) : (
        <ul className="comment-list">
          {data.items.map((comment) => (
            <li key={comment.id} className="comment-list__item">
              <Avatar avatar={comment.author.avatar} name={comment.author.display_name ?? comment.author.username} />
              <div className="comment-list__body">
                <div className="comment-list__head">
                  <span className="people-list__name">{comment.author.display_name ?? comment.author.username}</span>
                  <span className="people-list__handle">@{comment.author.username}</span>
                  <Badge>{TYPE_LABEL[comment.type] ?? comment.type}</Badge>
                  <time
                    className="comment-list__time"
                    dateTime={comment.created_at}
                    title={formatDateTime(comment.created_at, profile?.timezone)}
                  >
                    {formatRelative(comment.created_at, profile?.timezone)}
                  </time>
                </div>
                <p className="comment-list__text">{comment.preview || <em className="muted">Текст недоступен</em>}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
