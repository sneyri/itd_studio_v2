/**
 * Список уведомлений по текущим фильтрам: иконка типа, автор с галочкой верификации,
 * действие, текст, время, отметка «непрочитано», мини-превью поста. Подгрузка — «Показать ещё».
 */
import { useSession } from '@/features/auth/hooks'
import { mediaSummary } from '@/features/analytics/posts/media'
import { PostMediaThumb } from '@/features/analytics/posts/PostMedia'
import { formatDateTime, formatNumber, formatRelative, plural, truncate } from '@/shared/lib/format'
import { Avatar, Button, Card, EmptyState, ErrorState, IconBell, IconExternal, Skeleton, VerifiedBadge } from '@/shared/ui'
import { NOTIFICATIONS_PAGE_SIZE, useNotifications, useNotificationsSummary } from './hooks'
import { notificationMeta } from './notificationTypes'
import type { NotificationFilters, NotificationItem } from './types'

type Props = {
  filters: NotificationFilters
  activeCount: number
  onReset: () => void
  onSelectActor: (username: string) => void
}

function NotificationRow({
  item,
  timezone,
  onSelectActor,
}: {
  item: NotificationItem
  timezone?: string
  onSelectActor: (username: string) => void
}) {
  const meta = notificationMeta(item.type)
  const name = item.actor.display_name || item.actor.username || 'Пользователь'
  const unread = item.is_read === false
  const post = item.post

  return (
    <li className={`notif ${unread ? 'notif--unread' : ''}`}>
      <span className={`notif__type notif__type--${meta.tone}`} title={meta.label}>
        {meta.icon}
      </span>
      <Avatar avatar={item.actor.avatar} name={name} size={40} />
      <div className="notif__body">
        <p className="notif__headline">
          {item.actor.username ? (
            <button
              type="button"
              className="notif__actor"
              title={`Показать только уведомления от @${item.actor.username}`}
              onClick={() => onSelectActor(item.actor.username as string)}
            >
              {name}
            </button>
          ) : (
            <span className="notif__actor">{name}</span>
          )}
          <VerifiedBadge verified={item.actor.is_verified} size={14} />{' '}
          <span className="notif__action">{meta.action}</span>
        </p>
        {item.preview && <p className="notif__preview">{truncate(item.preview, 280)}</p>}
        {post && (
          <a className="notif__post" href={post.url} target="_blank" rel="noopener noreferrer">
            {post.attachments.length > 0 && <PostMediaThumb attachments={post.attachments} size={40} />}
            <span className="notif__post-text">
              {post.content ? truncate(post.content, 120) : (mediaSummary(post.attachments) ?? 'Пост без текста')}
            </span>
            <IconExternal size={13} />
          </a>
        )}
        <time className="notif__time" dateTime={item.created_at} title={formatDateTime(item.created_at, timezone)}>
          {formatRelative(item.created_at, timezone)}
        </time>
      </div>
      {unread && <span className="notif__dot" aria-label="Непрочитано" role="img" />}
    </li>
  )
}

export function NotificationsList({ filters, activeCount, onReset, onSelectActor }: Props) {
  const { profile } = useSession()
  const summary = useNotificationsSummary()
  const { data, isPending, isFetching, isFetchingNextPage, error, refetch, fetchNextPage, hasNextPage, isPlaceholderData } =
    useNotifications(filters)

  const items = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? 0
  const noneAtAll = summary.data?.total === 0
  const unknownVerified = filters.verified !== '' && (summary.data?.verified.unknown ?? 0) > 0

  return (
    <Card className="list-card notif-card" aria-busy={(isFetching && !isFetchingNextPage) || undefined}>
      <header className="notif-card__header">
        <div className="list-card__header">
          <h2 className="chart-card__title">Уведомления</h2>
          <p className="chart-card__subtitle">
            {data
              ? activeCount > 0
                ? `Найдено ${formatNumber(total)} ${plural(total, ['уведомление', 'уведомления', 'уведомлений'])}`
                : `${formatNumber(total)} ${plural(total, ['уведомление', 'уведомления', 'уведомлений'])} из истории итд`
              : 'Загрузка…'}
          </p>
        </div>
      </header>

      {unknownVerified && (
        <p className="posts-card__hint">
          Статус верификации известен не для всех: итд отдаёт его не во всех уведомлениях. {formatNumber(summary.data?.verified.unknown)}{' '}
          уведомлений с неизвестным статусом не попадают ни в «верифицированные», ни в «без галочки».
        </p>
      )}

      {isPending ? (
        <ul className="notif-list">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="notif">
              <Skeleton width={40} height={40} radius="50%" />
              <div className="notif__body">
                <Skeleton width="60%" height={14} />
                <Skeleton width="85%" height={12} />
              </div>
            </li>
          ))}
        </ul>
      ) : error && !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : items.length === 0 ? (
        noneAtAll ? (
          <EmptyState
            icon={<IconBell />}
            title="Уведомлений пока нет"
            description="Запустите синхронизацию: уведомления собираются из итд при каждой синхронизации. Итд хранит ограниченную историю, поэтому старые события могут быть недоступны."
          />
        ) : (
          <EmptyState
            compact
            title="Ничего не найдено"
            description="Под выбранные фильтры уведомлений нет."
            action={
              activeCount > 0 ? (
                <Button size="sm" onClick={onReset}>
                  Сбросить фильтры
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          <ul className={`notif-list ${isPlaceholderData ? 'notif-list--stale' : ''}`}>
            {items.map((item) => (
              <NotificationRow key={item.id} item={item} timezone={profile?.timezone} onSelectActor={onSelectActor} />
            ))}
          </ul>
          {hasNextPage && (
            <div className="notif-card__more">
              <Button loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                Показать ещё {Math.min(NOTIFICATIONS_PAGE_SIZE, total - items.length)}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
