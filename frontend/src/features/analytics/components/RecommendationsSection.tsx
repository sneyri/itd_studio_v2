import type { ReactElement } from 'react'

export function RecommendationsSection(): ReactElement {
    return (
        <section className="analytics-section">
            <div className="analytics-section-header">
                <div>
                    <p className="analytics-section-kicker">Рекомендации</p>
                    <h3>Что стоит улучшить</h3>
                </div>
            </div>
            <div className="analytics-section-grid two-column">
                <div className="analytics-panel">
                    <h4 className="analytics-panel-title">В разработке</h4>
                    <ul className="analytics-list">
                        <li>Делаем!</li>
                    </ul>
                </div>
            </div>
        </section>
    )
}
