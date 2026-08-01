import type { ReactElement } from 'react'
import { AnalyticsCard } from '../components/shared/AnalyticsCard'
import { EmptyState } from '../components/shared/EmptyState.tsx'

export function ContentAnalyticsPage(): ReactElement {
    return (
        <div className="analytics-overview">
            <div className="analytics-hero">
                <div>
                    <p className="analytics-hero-kicker">Контент</p>
                    <h2>Аналитика публикаций</h2>
                    <p className="analytics-hero-copy">Список постов, сравнение эффективности и выделение лучших публикаций.</p>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <AnalyticsCard title="Лучшие публикации" subtitle="По просмотрам и вовлеченности">
                    <EmptyState title="Данные скоро появятся" description="В следующем шаге здесь будет список самых эффективных постов." />
                </AnalyticsCard>
                <AnalyticsCard title="Сравнение публикаций" subtitle="Просмотры, лайки, комментарии">
                    <EmptyState title="Данные скоро появятся" description="Подготовим таблицу сравнений по каждому посту." />
                </AnalyticsCard>
            </div>
        </div>
    )
}
