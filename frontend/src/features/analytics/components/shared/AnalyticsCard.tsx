import type { ReactElement, ReactNode } from 'react'

interface AnalyticsCardProps {
    title: string
    subtitle?: string
    children: ReactNode
    className?: string
}

export function AnalyticsCard({ title, subtitle, children, className }: AnalyticsCardProps): ReactElement {
    return (
        <div className={`analytics-card ${className ?? ''}`.trim()}>
            <div className="analytics-card__header">
                <div>
                    <h4 className="analytics-card__title">{title}</h4>
                    {subtitle ? <p className="analytics-card__subtitle">{subtitle}</p> : null}
                </div>
            </div>
            <div className="analytics-card__body">{children}</div>
        </div>
    )
}
