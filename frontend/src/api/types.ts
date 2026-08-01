export type User = {
    username: string
    displayName?: string
    avatar?: string
    bio?: string
    followers_count: number
    following_count: number
    posts_count: number
}

export interface AnalyticsOverview {
    username: string
    display_name: string
    avatar?: string
    bio?: string
    followers_count: number
    following_count: number
    posts_count: number
    total_likes: number
    total_views: number
    total_comments: number
    total_reposts: number
    avg_likes_per_post: number
    avg_views_per_post: number
    avg_comments_per_post: number
    engagement_rate: number
    best_posting_time: {
        sufficient_data: boolean
        label: string | null
        reason?: string
        hour?: number
        posts_considered?: number
        sample_posts?: number
        avg_views?: number
        avg_interactions?: number
    }
    top_post: {
        id: string
        content: string
        views_count: number
        likes_count: number
        comments_count: number
        reposts_count: number
        created_at: string
    } | null
}

export interface GrowthData {
    date: string
    count: number
    daily: number
    posts: number
}