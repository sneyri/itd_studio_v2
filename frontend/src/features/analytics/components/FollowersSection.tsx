import type { ReactElement } from 'react'
import type { GrowthData } from '@/api/types'
import { GrowthChart } from './Charts/GrowthChart.tsx'

interface FollowersSectionProps {
    growthData: GrowthData[]
}

export function FollowersSection({ growthData }: FollowersSectionProps): ReactElement {
    return (
        <section className="analytics-section">
            <div className="analytics-section-header">
                <div>
                    <p className="analytics-section-kicker">Подписчики</p>
                    <h3>Рост аудитории</h3>
                </div>
            </div>
            <div className="analytics-section-grid one-column">
                <div className="analytics-panel analytics-panel--chart">
                    <GrowthChart data={growthData} title="Динамика подписчиков" color="#FFCC00" />
                </div>
            </div>
        </section>
    )
}
