/** Компактная строка метрик поста. */
import { formatNumber } from '@/shared/lib/format'
import { IconEye, IconHeart, IconMessage, IconShare } from '@/shared/ui'
import type { Post } from '../types'

export function PostStats({ post }: { post: Pick<Post, 'views_count' | 'likes_count' | 'comments_count' | 'reposts_count'> }) {
  return (
    <ul className="post-stats" aria-label="Метрики поста">
      <li title="Просмотры">
        <IconEye size={15} /> {formatNumber(post.views_count)}
      </li>
      <li title="Лайки">
        <IconHeart size={15} /> {formatNumber(post.likes_count)}
      </li>
      <li title="Комментарии">
        <IconMessage size={15} /> {formatNumber(post.comments_count)}
      </li>
      <li title="Репосты">
        <IconShare size={15} /> {formatNumber(post.reposts_count)}
      </li>
    </ul>
  )
}
