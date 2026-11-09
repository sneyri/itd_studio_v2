/**
 * Посты: сортировка, фильтр по медиа, постраничная навигация (GET /api/posts).
 * У поста с вложениями — миниатюра и бейдж «N фото / видео»; клик по строке раскрывает полный текст и медиа.
 * На узких экранах строки превращаются в карточки.
 */
import { useState } from 'react'
import { useSession } from '@/features/auth/hooks'
import { POSTS_PAGE_SIZE } from '@/shared/lib/constants'
import { formatDateTime, formatNumber, truncate } from '@/shared/lib/format'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconExternal,
  IconImage,
  IconPlay,
  Select,
  Skeleton,
  type SelectOption,
} from '@/shared/ui'
import { usePosts } from '../hooks'
import type { Post, PostsMediaFilter, PostsSort } from '../types'
import { mediaSummary } from './media'
import { PostMedia, PostMediaThumb } from './PostMedia'

const SORTS: ReadonlyArray<SelectOption<PostsSort>> = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'views', label: 'По просмотрам' },
  { value: 'likes', label: 'По лайкам' },
  { value: 'comments', label: 'По комментариям' },
]

const MEDIA: ReadonlyArray<SelectOption<PostsMediaFilter>> = [
  { value: 'all', label: 'Все посты' },
  { value: 'with_media', label: 'С медиа', icon: <IconImage size={16} /> },
  { value: 'image', label: 'С фото', icon: <IconImage size={16} /> },
  { value: 'video', label: 'С видео', icon: <IconPlay size={16} /> },
  { value: 'text_only', label: 'Только текст' },
]

function PostRow({ post, timezone }: { post: Post; timezone?: string }) {
  const [open, setOpen] = useState(false)
  const summary = mediaSummary(post.attachments)
  const expandable = post.attachments.length > 0 || post.content.length > 140
  const panelId = `post-${post.id}-details`

  return (
    <div className={`posts-table__item ${open ? 'posts-table__item--open' : ''}`} role="rowgroup">
      <div className="posts-table__row" role="row">
        <span role="cell" className="posts-table__content">
          {post.attachments.length > 0 && <PostMediaThumb attachments={post.attachments} />}
          <span className="posts-table__text">
            <a href={post.url} target="_blank" rel="noopener noreferrer" className="posts-table__link">
              {post.content ? truncate(post.content, 140) : <em className="muted">Без текста</em>}
              <IconExternal size={13} />
            </a>
            {(summary || post.is_repost) && (
              <span className="posts-table__badges">
                {summary && (
                  <Badge icon={post.attachments.some((a) => a.kind === 'video') ? <IconPlay size={12} /> : <IconImage size={12} />}>
                    {summary}
                  </Badge>
                )}
                {post.is_repost && <Badge>репост</Badge>}
              </span>
            )}
          </span>
          {expandable && (
            <button
              type="button"
              className={`posts-table__toggle ${open ? 'posts-table__toggle--open' : ''}`}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? 'Свернуть пост' : 'Показать пост целиком'}
              onClick={() => setOpen((v) => !v)}
            >
              <IconChevronDown size={16} />
            </button>
          )}
        </span>
        <span role="cell" className="posts-table__date">
          {formatDateTime(post.created_at, timezone)}
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
      {open && (
        <div className="posts-table__details" id={panelId}>
          {post.content && <p className="posts-table__full-text">{post.content}</p>}
          <PostMedia attachments={post.attachments} />
        </div>
      )}
    </div>
  )
}

export function PostsTable() {
  const [sort, setSort] = useState<PostsSort>('new')
  const [media, setMedia] = useState<PostsMediaFilter>('all')
  const [page, setPage] = useState(0)
  const { profile } = useSession()
  const { data, isPending, isFetching, error, refetch } = usePosts({
    limit: POSTS_PAGE_SIZE,
    offset: page * POSTS_PAGE_SIZE,
    sort,
    media,
  })

  const total = data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / POSTS_PAGE_SIZE))
  const filtered = media !== 'all'

  return (
    <Card className="posts-card" aria-busy={isFetching || undefined}>
      <header className="chart-card__header">
        <div className="chart-card__titles">
          <h2 className="chart-card__title">Посты</h2>
          <p className="chart-card__subtitle">
            {data
              ? `${formatNumber(total)} ${filtered ? 'по фильтру' : 'в локальной базе'} · метрики на момент последней синхронизации`
              : 'Загрузка…'}
          </p>
        </div>
        <div className="posts-card__controls">
          <Select
            size="sm"
            ariaLabel="Фильтр по медиа"
            options={MEDIA}
            value={media}
            onChange={(value) => {
              setMedia(value)
              setPage(0)
            }}
          />
          <Select
            size="sm"
            ariaLabel="Сортировка постов"
            options={SORTS}
            value={sort}
            onChange={(value) => {
              setSort(value)
              setPage(0)
            }}
          />
        </div>
      </header>

      {data && !data.attachments_synced && (
        <p className="posts-card__hint">
          <IconImage size={15} /> Картинки и видео появятся после следующей синхронизации — раньше они не сохранялись.
        </p>
      )}

      {isPending ? (
        <div className="posts-table__skeleton">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} height={52} radius="var(--radius-md)" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      ) : !data || data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            compact
            title="Под фильтр ничего не попало"
            description={
              data && !data.attachments_synced
                ? 'Медиа ещё не синхронизированы — запустите синхронизацию.'
                : 'Попробуйте другой фильтр.'
            }
            action={
              <Button size="sm" onClick={() => setMedia('all')}>
                Показать все посты
              </Button>
            }
          />
        ) : (
          <EmptyState compact title="Постов нет" description="Синхронизируйте аккаунт, чтобы загрузить посты." />
        )
      ) : (
        <>
          <div className="posts-table" role="table" aria-label="Посты">
            <div className="posts-table__row posts-table__row--head" role="row">
              <span role="columnheader">Пост</span>
              <span role="columnheader">Дата</span>
              <span role="columnheader" className="num">
                Просм.
              </span>
              <span role="columnheader" className="num">
                Лайки
              </span>
              <span role="columnheader" className="num">
                Комм.
              </span>
              <span role="columnheader" className="num">
                Реп.
              </span>
            </div>
            {data.items.map((post) => (
              <PostRow key={post.id} post={post} timezone={profile?.timezone} />
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
