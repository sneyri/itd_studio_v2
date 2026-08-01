import type { ReactElement } from 'react'
import type { AnalyticsOverview } from '@/api/types'
import { formatNumber } from '../utils'
import { EngagementChart } from './Charts/EngagementChart.tsx'

interface EngagementSectionProps {
    overview: AnalyticsOverview
}

export function EngagementSection({ overview }: EngagementSectionProps): ReactElement {
    return (
        <section className="analytics-section">
            <div className="analytics-section-header">
                <div>
                    <p className="analytics-section-kicker">Вовлеченность</p>
                    <h3>Как аудитория реагирует</h3>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <div className="analytics-panel">
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Рейтинг вовлеченности</span>
                        <span className="analytics-metric-value">{(overview.engagement_rate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Лайки</span>
                        <span className="analytics-metric-value">{formatNumber(overview.total_likes)}</span>
                    </div>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Комментарии</span>
                        <span className="analytics-metric-value">{formatNumber(overview.total_comments)}</span>
                    </div>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Репосты</span>
                        <span className="analytics-metric-value">{formatNumber(overview.total_reposts)}</span>
                    </div>
                </div>
                <div className="analytics-panel analytics-panel--chart">
                    <EngagementChart overview={overview} />
                </div>
            </div>
        </section>
    )
}
