import type { ReactElement } from 'react'
import { AnalyticsCard } from '../components/shared/AnalyticsCard'
import { EmptyState } from '../components/shared/EmptyState.tsx'

export function PerformancePage(): ReactElement {
    return (
        <div className="analytics-overview">
            <div className="analytics-hero">
                <div>
                    <p className="analytics-hero-kicker">Эффективность</p>
                    <h2>Эффективность контента</h2>
                    <p className="analytics-hero-copy">CTR, engagement rate и другие глубокие метрики по взаимодействию.</p>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <AnalyticsCard title="CTR и вовлеченность" subtitle="Основные показатели">
                    <EmptyState title="Данные скоро появятся" description="Подключим более детальную воронку взаимодействия и сравнение контента." />
                </AnalyticsCard>
                <AnalyticsCard title="Сравнение контента" subtitle="Что работает лучше">
                    <EmptyState title="Данные скоро появятся" description="Здесь будет аналитика по эффективности отдельных публикаций." />
                </AnalyticsCard>
            </div>
        </div>
    )
}
