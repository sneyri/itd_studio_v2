import type { ReactElement } from 'react'

interface EmptyStateProps {
    title?: string
    description?: string
}

export function EmptyState({ title = 'Пока нет данных', description = 'Этот раздел будет заполнен после подключения дополнительных метрик.' }: EmptyStateProps): ReactElement {
    return (
        <div className="analytics-empty-state">
            <h4>{title}</h4>
            <p>{description}</p>
        </div>
    )
}
