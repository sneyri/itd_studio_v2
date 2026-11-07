/** Таблица постов с сортировкой и постраничной навигацией (GET /api/posts). */
import { useState } from 'react'
import { useSession } from '@/features/auth/hooks'
import { POSTS_PAGE_SIZE } from '@/shared/lib/constants'
import { formatDateTime, formatNumber, truncate } from '@/shared/lib/format'
import { Badge, Button, Card, EmptyState, ErrorState, IconChevronLeft, IconChevronRight, IconExternal, Skeleton, Tabs } from '@/shared/ui'
import { usePosts } from '../hooks'
import type { PostsSort } from '../types'

const SORTS: ReadonlyArray<{ value: PostsSort; label: string; shortLabel: string }> = [
  { value: 'new', label: 'Новые', shortLabel: 'Новые' },
  { value: 'views', label: 'Просмотры', shortLabel: 'Просм.' },
  { value: 'likes', label: 'Лайки', shortLabel: 'Лайки' },
  { value: 'comments', label: 'Комментарии', shortLabel: 'Комм.' },
]

export function PostsTable() {
  const [sort, setSort] = useState<PostsSort>('new')
  const [page, setPage] = useState(0)
  const { profile } = useSession()
  const { data, isPending, isFetching, error, refetch } = usePosts({ limit: POSTS_PAGE_SIZE, offset: page * POSTS_PAGE_SIZE, sort })

  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE))

  const changeSort = (value: PostsSort) => {
    setSort(value)
    setPage(0)
  }

  return (
    <Card className="posts-card" aria-busy={isFetching || undefined}>
      <header className="chart-card__header">
        <div className="chart-card__titles">
          <h2 className="chart-card__title">Посты</h2>
          <p className="chart-card__subtitle">
            {data ? `${formatNumber(total)} в локальной базе · метрики на момент последней синхронизации` : 'Загрузка…'}
          </p>
        </div>
        <Tabs size="sm" label="Сортировка постов" options={SORTS} value={sort} onChange={changeSort} />
      </header>

      {isPending ? (
        <div className="posts-table__skeleton">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={44} radius="var(--radius-md)" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : !data || data.items.length === 0 ? (
        <EmptyState compact title="Постов нет" description="Синхронизируйте аккаунт, чтобы загрузить посты." />
      ) : (
        <>
          <div className="posts-table" role="table" aria-label="Посты">
            <div className="posts-table__row posts-table__row--head" role="row">
              <span role="columnheader">Пост</span>
              <span role="columnheader">Дата</span>
              <span role="columnheader" className="num">Просм.</span>
              <span role="columnheader" className="num">Лайки</span>
              <span role="columnheader" className="num">Комм.</span>
              <span role="columnheader" className="num">Реп.</span>
            </div>
            {data.items.map((post) => (
              <div key={post.id} className="posts-table__row" role="row">
                <span role="cell" className="posts-table__content">
                  <a href={post.url} target="_blank" rel="noopener noreferrer" className="posts-table__link">
                    {post.content ? truncate(post.content, 140) : <em className="muted">Без текста</em>}
                    <IconExternal size={13} />
                  </a>
                  {post.is_repost && <Badge>репост</Badge>}
                </span>
                <span role="cell" className="posts-table__date">
                  {formatDateTime(post.created_at, profile?.timezone)}
                </span>
                <span role="cell" className="num" data-label="Просм.">
                  {formatNumber(post.views_count)}
                </span>
                <span role="cell" className="num" data-label="Лайки">
                  {formatNumber(post.likes_count)}
                </span>
                <span role="cell" className="num" data-label="Комм.">
                  {formatNumber(post.comments_count)}
                </span>
                <span role="cell" className="num" data-label="Реп.">
                  {formatNumber(post.reposts_count)}
                </span>
              </div>
            ))}
          </div>
          <nav className="pagination" aria-label="Страницы постов">
            <Button
              size="sm"
              variant="ghost"
              icon={<IconChevronLeft size={16} />}
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Предыдущая страница"
            />
            <span className="pagination__label">
              {page + 1} из {pages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={<IconChevronRight size={16} />}
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Следующая страница"
            />
          </nav>
        </>
      )}
    </Card>
  )
}
