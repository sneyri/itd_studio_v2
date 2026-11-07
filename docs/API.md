# ITD-Studio HTTP API (v2)

Базовый префикс: `/api`. Все ответы — JSON в `snake_case`. Даты — ISO-8601 в UTC с `Z`
(`2026-11-07T19:10:09.607Z`), дни — `YYYY-MM-DD` в часовом поясе пользователя.

Аутентификация — httpOnly cookie `itd_session` (ставит `POST /api/auth/login`).
Без cookie все эндпоинты, кроме `GET /api/status` и `POST /api/auth/login`, отвечают `401`.

Ошибки всегда в одном формате:

```json
{ "error": { "code": "sync_cooldown", "message": "Синхронизация доступна раз в 10 минут", "retry_after": 312 } }
```

`code`: `unauthorized` (401), `invalid_token` (401 на login), `not_found` (404), `validation_error` (422),
`sync_cooldown` (429, есть `retry_after` в секундах), `itd_unavailable` (502), `internal_error` (500).

---

## Служебное

### `GET /api/status` (публичный)
```json
{ "status": "ok", "version": "2.0.0" }
```

## Auth

### `POST /api/auth/login` (публичный)
Тело: `{ "refresh_token": "..." }`. Проверяет токен через `itd`, сохраняет его зашифрованным,
ставит cookie. Ответ `200` — `Profile` (см. ниже).

### `POST /api/auth/logout`
`204`. Удаляет сессию и сохранённый refresh_token (данные аналитики остаются).

### `GET /api/auth/me`
`200` — `Profile`.

```ts
type Profile = {
  username: string
  display_name: string | null
  avatar: string | null        // может быть URL картинки ИЛИ эмодзи (так отдаёт итд)
  bio: string | null
  followers_count: number
  following_count: number
  posts_count: number
  registered_at: string | null // дата регистрации в итд
  timezone: string             // "Europe/Moscow"
  last_synced_at: string | null
}
```

## Settings

### `GET /api/settings` → `{ "timezone": "Europe/Moscow" }`
### `PUT /api/settings` тело `{ "timezone": "Asia/Yekaterinburg" }` → то же. `422`, если пояс неизвестен.

## Sync

### `POST /api/sync`
Без тела. Создаёт задачу и сразу отвечает `202` — `SyncJob`. Если задача уже в очереди/выполняется —
`202` с ней же. Если прошло меньше `SYNC_COOLDOWN` с последней успешной — `429 sync_cooldown`.

### `GET /api/sync/latest` → `SyncJob | null`
### `GET /api/sync/{job_id}` → `SyncJob` (только свои задачи, иначе 404)

```ts
type SyncJob = {
  id: number
  status: "queued" | "running" | "done" | "failed"
  created_at: string
  started_at: string | null
  finished_at: string | null
  posts_synced: number | null
  new_follow_events: number | null
  error: string | null          // общий текст для пользователя, без деталей
}
```

## Posts

### `GET /api/posts?limit=50&offset=0&sort=new|views|likes|comments`
`limit` 1..200, `offset` ≥ 0.
```ts
type PostsPage = { items: Post[]; total: number; limit: number; offset: number }
type Post = {
  id: string
  content: string            // "" если текста нет
  created_at: string
  views_count: number
  likes_count: number
  comments_count: number
  reposts_count: number
  is_repost: boolean
  url: string                // ссылка на пост на итд.com
}
```

## Analytics

Каждый ряд несёт `source`, чтобы UI честно подписывал происхождение данных:
`"snapshot"` — реальные снимки, `"notifications"` — восстановлено по уведомлениям,
`"post_date"` — сумма метрик постов по дате публикации (не рост во времени).

### `GET /api/analytics/overview`
```ts
type Overview = {
  followers_count: number
  following_count: number
  posts_count: number            // постов в локальной базе
  followers_today: number | null // новые подписчики сегодня по уведомлениям; null = данных нет
  total_views: number
  total_likes: number
  total_comments: number
  total_reposts: number
  avg_views_per_post: number
  avg_likes_per_post: number
  avg_comments_per_post: number
  engagement_rate: number        // ER по просмотрам: (лайки+комменты+репосты)/просмотры, доля 0..1
  engagement_rate_formula: string
  best_posting_time: BestPostingTime
  top_post: Post | null          // по просмотрам
  last_synced_at: string | null
}
type BestPostingTime = {
  sufficient_data: boolean
  hour: number | null            // 0..23 в timezone
  label: string | null           // "05:00 - 06:00"
  avg_views: number | null
  avg_interactions: number | null
  sample_posts: number | null
  reason: string | null          // почему данных недостаточно
  timezone: string
}
```

### `GET /api/analytics/audience/followers`
```ts
type FollowersSeries = {
  current: number
  points: { date: string; followers: number; new_followers: number | null; source: "snapshot" | "notifications" }[]
  snapshots_since: string | null       // дата первого снимка
  notifications_since: string | null   // самая ранняя подписка, найденная в уведомлениях
  includes_unfollows: false            // API итд не отдаёт отписки
  note: string                         // готовая подпись для UI
}
```

### `GET /api/analytics/audience/new-followers?limit=20`
Последние подписчики по уведомлениям:
```ts
type NewFollower = { username: string; display_name: string | null; avatar: string | null; followed_at: string }
// ответ: { items: NewFollower[] }
```

### `GET /api/analytics/engagement/by-publication-date`
Метрики постов, сгруппированные по **дню публикации** (не рост во времени!):
```ts
type PublicationDay = { date: string; posts: number; views: number; likes: number; comments: number; reposts: number }
// ответ: { source: "post_date"; timezone: string; items: PublicationDay[] }
```

### `GET /api/analytics/engagement/dynamics`
Реальная динамика суммарных метрик по снимкам (`post_metrics_snapshots`), одна точка на снимок-день:
```ts
type DynamicsPoint = { date: string; views: number; likes: number; comments: number; reposts: number }
// ответ: { source: "snapshot"; items: DynamicsPoint[]; since: string | null }
```

### `GET /api/analytics/posting-time`
```ts
type PostingTime = {
  timezone: string
  min_posts_per_bucket: number
  buckets: { hour: number; posts: number; avg_views: number; avg_interactions: number; sufficient: boolean }[] // 24 шт.
  best: BestPostingTime
}
```

### `GET /api/analytics/weekdays`
Активность по дням недели (по дате публикации, в timezone):
```ts
// { items: { weekday: number /* 0=Пн */; posts: number; views: number; interactions: number }[] }
```

## Comments

### `GET /api/comments/recent?limit=30`
Комментарии к постам пользователя из уведомлений итд (`comment`, `reply`, `comment_mention`):
```ts
type CommentEvent = {
  id: string
  type: "comment" | "reply" | "comment_mention"
  author: { username: string; display_name: string | null; avatar: string | null }
  preview: string | null
  post_id: string | null
  created_at: string
}
// ответ: { items: CommentEvent[]; since: string | null }
```

### `GET /api/comments/top-posts?limit=10` → `{ items: Post[] }` — посты с наибольшим числом комментариев.
