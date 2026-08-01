import type { ReactElement, ReactNode } from 'react'

interface ChartContainerProps {
    title: string
    subtitle?: string
    children: ReactNode
    empty?: boolean
    emptyMessage?: string
}

export function ChartContainer({ title, subtitle, children, empty = false, emptyMessage = 'Нет данных для отображения' }: ChartContainerProps): ReactElement {
    return (
        <div className="analytics-chart-card">
            <div className="analytics-chart-card__header">
                <div>
                    <h4 className="analytics-card__title">{title}</h4>
                    {subtitle ? <p className="analytics-card__subtitle">{subtitle}</p> : null}
                </div>
            </div>
            {empty ? <div className="analytics-empty-state">{emptyMessage}</div> : <div className="analytics-chart-card__body">{children}</div>}
        </div>
    )
}
