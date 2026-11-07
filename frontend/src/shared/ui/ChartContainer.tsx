/**
 * Карточка для графика/блока данных: заголовок, подпись, бейджи, действия
 * и единая обработка состояний loading / error / empty.
 */
import type { ReactNode } from 'react'
import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Skeleton } from './Skeleton'

type ChartContainerProps = {
  title: ReactNode
  subtitle?: ReactNode
  badges?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  height?: number
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  empty?: { title: string; description?: ReactNode } | null
  /** Прятать actions (переключатели), когда данных нет или ошибка. По умолчанию — да. */
  hideActionsWhenEmpty?: boolean
  className?: string
  children?: ReactNode
}

export function ChartContainer({
  title,
  subtitle,
  badges,
  actions,
  footer,
  height = 260,
  loading = false,
  error,
  onRetry,
  empty,
  hideActionsWhenEmpty = true,
  className,
  children,
}: ChartContainerProps) {
  const showActions = Boolean(actions) && !(hideActionsWhenEmpty && (error || empty))
  let body: ReactNode
  if (loading) body = <Skeleton height={height} radius="var(--radius-lg)" />
  else if (error) body = <ErrorState error={error} onRetry={onRetry} compact />
  else if (empty) body = <EmptyState title={empty.title} description={empty.description} compact />
  else body = children

  return (
    <Card className={`chart-card ${className ?? ''}`}>
      <header className="chart-card__header">
        <div className="chart-card__titles">
          <h2 className="chart-card__title">{title}</h2>
          {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
        </div>
        {showActions && <div className="chart-card__actions">{actions}</div>}
      </header>
      {badges && !loading && !error && <div className="chart-card__badges">{badges}</div>}
      <div className="chart-card__body" style={{ minHeight: loading || error || empty ? undefined : height }}>
        {body}
      </div>
      {footer && !loading && !error && !empty && <footer className="chart-card__footer">{footer}</footer>}
    </Card>
  )
}
