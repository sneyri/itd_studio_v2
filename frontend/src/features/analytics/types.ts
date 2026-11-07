/** Типы ответов аналитики и постов — строго по docs/API.md. */

/** Происхождение ряда: реальные снимки / восстановлено по уведомлениям / по дате публикации постов */
export type DataSource = 'snapshot' | 'notifications' | 'post_date'

export type Post = {
  id: string
  content: string
  created_at: string
  views_count: number
  likes_count: number
  comments_count: number
  reposts_count: number
  is_repost: boolean
  url: string
}

export type PostsSort = 'new' | 'views' | 'likes' | 'comments'

export type PostsPage = {
  items: Post[]
  total: number
  limit: number
  offset: number
}

export type BestPostingTime = {
  sufficient_data: boolean
  hour: number | null
  label: string | null
  avg_views: number | null
  avg_interactions: number | null
  sample_posts: number | null
  reason: string | null
  timezone: string
}

export type Overview = {
  followers_count: number
  following_count: number
  posts_count: number
  followers_today: number | null
  total_views: number
  total_likes: number
  total_comments: number
  total_reposts: number
  avg_views_per_post: number
  avg_likes_per_post: number
  avg_comments_per_post: number
  engagement_rate: number
  engagement_rate_formula: string
  best_posting_time: BestPostingTime
  top_post: Post | null
  last_synced_at: string | null
}

export type FollowersPoint = {
  date: string
  followers: number
  new_followers: number | null
  source: 'snapshot' | 'notifications'
}

export type FollowersSeries = {
  current: number
  points: FollowersPoint[]
  snapshots_since: string | null
  notifications_since: string | null
  includes_unfollows: false
  note: string
}

export type NewFollower = {
  username: string
  display_name: string | null
  avatar: string | null
  followed_at: string
}

export type NewFollowersResponse = { items: NewFollower[] }

export type PublicationDay = {
  date: string
  posts: number
  views: number
  likes: number
  comments: number
  reposts: number
}

export type PublicationDaysResponse = {
  source: 'post_date'
  timezone: string
  items: PublicationDay[]
}

export type DynamicsPoint = {
  date: string
  views: number
  likes: number
  comments: number
  reposts: number
}

export type DynamicsResponse = {
  source: 'snapshot'
  items: DynamicsPoint[]
  since: string | null
}

export type PostingTimeBucket = {
  hour: number
  posts: number
  avg_views: number
  avg_interactions: number
  sufficient: boolean
}

export type PostingTime = {
  timezone: string
  min_posts_per_bucket: number
  buckets: PostingTimeBucket[]
  best: BestPostingTime
}

export type WeekdayActivity = {
  weekday: number
  posts: number
  views: number
  interactions: number
}

export type WeekdaysResponse = { items: WeekdayActivity[] }
