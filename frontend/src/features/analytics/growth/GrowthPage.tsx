import type { ReactElement } from 'react'
import { AnalyticsCard } from '../components/shared/AnalyticsCard'
import { EmptyState } from '../components/shared/EmptyState.tsx'

export function GrowthPage(): ReactElement {
    return (
        <div className="analytics-overview">
            <div className="analytics-hero">
                <div>
                    <p className="analytics-hero-kicker">Рост</p>
                    <h2>Рост аккаунта</h2>
                    <p className="analytics-hero-copy">Сравнение периодов, темпы роста и прогноз развития.</p>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <AnalyticsCard title="Динамика роста" subtitle="Подписчики и активность">
                    <EmptyState title="Данные скоро появятся" description="Здесь будет развернутая картина роста по периодам." />
                </AnalyticsCard>
                <AnalyticsCard title="Сравнение периодов" subtitle="Тренды и прогнозы">
                    <EmptyState title="Данные скоро появятся" description="Подготовим сравнение текущего и предыдущего периодов." />
                </AnalyticsCard>
            </div>
        </div>
    )
}
