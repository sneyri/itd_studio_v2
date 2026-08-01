import type { ReactElement } from 'react'
import type { AnalyticsOverview, GrowthData } from '@/api/types'
import { SummaryCards } from './SummaryCards'
import { FollowersSection } from './FollowersSection'
import { PostsSection } from './PostsSection'
import { EngagementSection } from './EngagementSection'
import { PublishingSection } from './PublishingSection'
import { RecommendationsSection } from './RecommendationsSection'

interface OverviewSectionProps {
    overview: AnalyticsOverview
    growthData: Record<string, GrowthData[]>
}

export function OverviewSection({ overview, growthData }: OverviewSectionProps): ReactElement {
    return (
        <div className="analytics-overview">
            <div className="analytics-hero">
                <div>
                    <p className="analytics-hero-kicker">Обзор</p>
                    <h2>Ключевые показатели аккаунта</h2>
                    <p className="analytics-hero-copy">Быстрый взгляд на рост, публикации и вовлеченность в одном месте.</p>
                </div>
            </div>

            <SummaryCards overview={overview} growthData={growthData} />
            <PostsSection overview={overview} />
            <EngagementSection overview={overview} />
            <FollowersSection growthData={growthData.followers || []} />
            <PublishingSection overview={overview} />
            <RecommendationsSection />
        </div>
    )
}
