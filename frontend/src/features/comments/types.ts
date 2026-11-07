/** Типы комментариев (docs/API.md → Comments). */
import type { Post } from '@/features/analytics/types'

export type CommentEventType = 'comment' | 'reply' | 'comment_mention'

export type CommentEvent = {
  id: string
  type: CommentEventType
  author: { username: string; display_name: string | null; avatar: string | null }
  preview: string | null
  post_id: string | null
  created_at: string
}

export type RecentCommentsResponse = { items: CommentEvent[]; since: string | null }
export type TopCommentedResponse = { items: Post[] }
