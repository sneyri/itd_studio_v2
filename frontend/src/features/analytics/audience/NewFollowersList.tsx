/** Последние подписчики — по уведомлениям итд типа follow. */
import { useSession } from '@/features/auth/hooks'
import { formatRelative, formatDateTime } from '@/shared/lib/format'
import { Avatar, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { useNewFollowers } from '../hooks'

export function NewFollowersList({ limit = 20 }: { limit?: number }) {
  const { data, isPending, error, refetch } = useNewFollowers(limit)
  const { profile } = useSession()

  return (
    <Card className="list-card">
      <header className="list-card__header">
        <h2 className="chart-card__title">Новые подписчики</h2>
        <p className="chart-card__subtitle">Из уведомлений итд — единственного источника дат подписки</p>
      </header>
      {isPending ? (
        <ul className="people-list">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="people-list__item">
              <Skeleton width={38} height={38} radius="50%" />
              <Skeleton width="50%" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          compact
          title="Подписок в уведомлениях не найдено"
          description="Либо новых подписчиков не было, либо уведомления о них уже удалены из истории итд."
        />
      ) : (
        <ul className="people-list">
          {data.items.map((person) => (
            <li key={`${person.username}-${person.followed_at}`} className="people-list__item">
              <Avatar avatar={person.avatar} name={person.display_name ?? person.username} />
              <div className="people-list__text">
                <span className="people-list__name">{person.display_name ?? person.username}</span>
                <span className="people-list__handle">@{person.username}</span>
              </div>
              <time className="people-list__time" dateTime={person.followed_at} title={formatDateTime(person.followed_at, profile?.timezone)}>
                {formatRelative(person.followed_at, profile?.timezone)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
