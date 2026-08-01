import type { ReactElement, ReactNode } from 'react'

interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: string
    trendType?: 'positive' | 'negative'
    action?: ReactNode
}

export function MetricCard({ title, value, subtitle, trend, trendType, action }: MetricCardProps): ReactElement {
    return (
        <div className="analytics-metric-card">
            <div className="analytics-metric-card__header">
                <span className="analytics-metric-card__title">{title}</span>
                {action}
            </div>
            <div className="analytics-metric-card__value-row">
                <span className="analytics-metric-card__value">{value}</span>
                {trend ? <span className={`analytics-summary-trend ${trendType ?? ''}`}>{trend}</span> : null}
            </div>
            {subtitle ? <span className="analytics-metric-card__subtitle">{subtitle}</span> : null}
        </div>
    )
}
