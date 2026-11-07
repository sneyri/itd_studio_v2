/** Карточка метрики: иконка, подпись, крупное значение и необязательная приписка. */
import type { ReactNode } from 'react'
import { Skeleton } from './Skeleton'

type MetricCardProps = {
  icon: ReactNode
  label: ReactNode
  value: ReactNode
  aside?: ReactNode
  hint?: ReactNode
  loading?: boolean
}

export function MetricCard({ icon, label, value, aside, hint, loading = false }: MetricCardProps) {
  return (
    <article className="metric-card card card--interactive" aria-busy={loading || undefined}>
      <span className="metric-card__icon">{icon}</span>
      <div className="metric-card__body">
        <span className="metric-card__label">{label}</span>
        {loading ? (
          <Skeleton width={96} height={28} />
        ) : (
          <div className="metric-card__value-row">
            <span className="metric-card__value">{value}</span>
            {aside && <span className="metric-card__aside">{aside}</span>}
          </div>
        )}
        {hint && !loading && <span className="metric-card__hint">{hint}</span>}
      </div>
    </article>
  )
}
