import type { AnalyticsOverview } from '@/api/types'
import type { ChartType } from './types'

export const COLORS: string[] = ['#6366f1', '#8b5cf6', '#c084fc', '#fbbf24', '#34d399', '#f472b6']

export const CHART_CONFIG: Record<ChartType, { title: string; color: string; fill: string }> = {
    likes: {
        title: 'Лайки',
        color: '#6366f1',
        fill: 'rgba(99, 102, 241, 0.2)'
    },
    comments: {
        title: 'Комментарии',
        color: '#8b5cf6',
        fill: 'rgba(139, 92, 246, 0.2)'
    },
    reposts: {
        title: 'Репосты',
        color: '#c084fc',
        fill: 'rgba(192, 132, 252, 0.2)'
    },
    followers: {
        title: 'Подписчики',
        color: '#fbbf24',
        fill: 'rgba(251, 191, 36, 0.2)'
    },
    views: {
        title: 'Просмотры',
        color: '#34d399',
        fill: 'rgba(52, 211, 153, 0.2)'
    }
}

export const formatDate = (dateStr: string): string => {
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    } catch {
        return dateStr
    }
}

export const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

export const formatTooltipDate = (label: string): string => {
    try {
        const date = new Date(label)
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
        return label
    }
}

export const buildEngagementData = (overview: AnalyticsOverview | null) => [
    { name: 'Лайки', value: overview?.total_likes || 0 },
    { name: 'Комментарии', value: overview?.total_comments || 0 },
    { name: 'Репосты', value: overview?.total_reposts || 0 }
].filter((item) => item.value > 0)

export const buildBestTimeData = (overview: AnalyticsOverview | null) => overview?.best_posting_time?.sufficient_data ? [
    { name: 'Просмотры', value: overview.best_posting_time.avg_views || 0 },
    { name: 'Взаимодействия', value: overview.best_posting_time.avg_interactions || 0 }
] : []
