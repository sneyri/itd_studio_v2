import type { ReactElement } from 'react'
import type { AnalyticsOverview } from '@/api/types'

interface PublishingSectionProps {
    overview: AnalyticsOverview
}

export function PublishingSection({ overview }: PublishingSectionProps): ReactElement {
    return (
        <section className="analytics-section">
            <div className="analytics-section-header">
                <div>
                    <p className="analytics-section-kicker">Публикации</p>
                    <h3>Лучшее время и ритм</h3>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <div className="analytics-panel">
                    <h4 className="analytics-panel-title">Лучшее время</h4>
                    {overview.best_posting_time.sufficient_data ? (
                        <>
                            <div className="analytics-highlight">
                                <span>{overview.best_posting_time.label}</span>
                            </div>
                            <p className="analytics-panel-text">
                                Основано на {overview.best_posting_time.posts_considered} публикациях. Средний охват — {overview.best_posting_time.avg_views} просмотров.
                            </p>
                        </>
                    ) : (
                        <p className="analytics-panel-text">{overview.best_posting_time.reason || 'Недостаточно данных'}</p>
                    )}
                </div>
                <div className="analytics-panel">
                    <h4 className="analytics-panel-title">Рекомендации по графику</h4>
                    <ul className="analytics-list">
                        <li>Сохраняйте стабильность публикаций в течение недели.</li>
                        <li>Используйте пиковые часы для контента с высоким потенциалом.</li>
                        <li>Сравнивайте результаты по дням и форматам.</li>
                    </ul>
                </div>
            </div>
        </section>
    )
}
