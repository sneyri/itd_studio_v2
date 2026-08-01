import type { ReactElement } from 'react'
import type { AnalyticsOverview, GrowthData } from '@/api/types'
import { SummaryCards } from '../components/SummaryCards'
import { FollowersSection } from '../components/FollowersSection'
import { PostsSection } from '../components/PostsSection'
import { EngagementSection } from '../components/EngagementSection'
import { PublishingSection } from '../components/PublishingSection'
import { RecommendationsSection } from '../components/RecommendationsSection'

interface OverviewPageProps {
    overview: AnalyticsOverview
    growthData: Record<string, GrowthData[]>
}

export function OverviewPage({ overview, growthData }: OverviewPageProps): ReactElement {
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
