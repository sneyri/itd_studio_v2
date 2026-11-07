/** Типы сессии/профиля (docs/API.md → Auth). */
export type Profile = {
  username: string
  display_name: string | null
  avatar: string | null
  bio: string | null
  followers_count: number
  following_count: number
  posts_count: number
  registered_at: string | null
  timezone: string
  last_synced_at: string | null
}
