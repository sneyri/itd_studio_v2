import type { ReactElement } from 'react'
import { AnalyticsCard } from '../components/shared/AnalyticsCard'
import { EmptyState } from '../components/shared/EmptyState.tsx'

export function AudiencePage(): ReactElement {
    return (
        <div className="analytics-overview">
            <div className="analytics-hero">
                <div>
                    <p className="analytics-hero-kicker">Аудитория</p>
                    <h2>Аналитика аудитории</h2>
                    <p className="analytics-hero-copy">Скоро здесь появятся глубинные метрики по росту, активности и удержанию аудитории.</p>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <AnalyticsCard title="Рост подписчиков" subtitle="По времени">
                    <EmptyState title="Данные скоро появятся" description="Подключим источники подписки и активность аудитории в следующем этапе." />
                </AnalyticsCard>
                <AnalyticsCard title="Активность аудитории" subtitle="Время и поведение">
                    <EmptyState title="Данные скоро появятся" description="Здесь можно будет показать пики активности и поведение пользователей." />
                </AnalyticsCard>
            </div>
        </div>
    )
}
