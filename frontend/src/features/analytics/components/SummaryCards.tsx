import type { ReactElement } from 'react'
import type { AnalyticsOverview, GrowthData } from '@/api/types'
import { formatNumber } from '../utils'

interface SummaryCardsProps {
    overview: AnalyticsOverview
    growthData: Record<string, GrowthData[]>
}

export function SummaryCards({ overview, growthData }: SummaryCardsProps): ReactElement {
    const formatTrendValue = (value: number) => value >= 0 ? `+${formatNumber(value)}` : formatNumber(value)

    const followerSeries = growthData.followers || []
    const likesSeries = growthData.likes || []
    const viewsSeries = growthData.views || []

    const followerGrowth = followerSeries[followerSeries.length - 1]?.daily ?? 0
    const likesGrowth = likesSeries[likesSeries.length - 1]?.daily ?? 0
    const viewsGrowth = viewsSeries[viewsSeries.length - 1]?.daily ?? 0

    const postsSeries = likesSeries.length > 0 ? likesSeries : followerSeries
    const postsGrowth = (postsSeries[postsSeries.length - 1]?.posts ?? 0) - (postsSeries[postsSeries.length - 2]?.posts ?? 0)

    const summaryItems = [
        { label: 'Подписчики', value: formatNumber(overview.followers_count), hint: 'Текущий охват', trend: formatTrendValue(followerGrowth), trendType: followerGrowth >= 0 ? 'positive' : 'negative' },
        { label: 'Посты', value: formatNumber(overview.posts_count), hint: 'За последний период', trend: formatTrendValue(postsGrowth), trendType: postsGrowth >= 0 ? 'positive' : 'negative' },
        { label: 'Лайки', value: formatNumber(overview.total_likes), hint: 'Общая активность', trend: formatTrendValue(likesGrowth), trendType: likesGrowth >= 0 ? 'positive' : 'negative' },
        { label: 'Просмотры', value: formatNumber(overview.total_views), hint: 'Общий охват', trend: formatTrendValue(viewsGrowth), trendType: viewsGrowth >= 0 ? 'positive' : 'negative' },
    ]

    return (
        <div className="analytics-summary-grid">
            {summaryItems.map((item) => (
                <div key={item.label} className="analytics-summary-card">
                    <span className="analytics-summary-label">{item.label}</span>
                    <div className="analytics-summary-value-row">
                        <span className="analytics-summary-value">{item.value}</span>
                        {item.trend ? (
                            <span className={`analytics-summary-trend ${item.trendType ?? ''}`}>{item.trend}</span>
                        ) : null}
                    </div>
                    <span className="analytics-summary-hint">{item.hint}</span>
                </div>
            ))}
        </div>
    )
}
