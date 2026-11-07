/**
 * Всплывающая подсказка для графиков Recharts в стиле дизайн-системы.
 * Использование: <Tooltip content={chartTooltip<Row>((row) => ({ title, rows }))} />
 */
import type { ReactNode } from 'react'

export type ChartTooltipModel = {
  title: ReactNode
  rows: Array<{ label: ReactNode; value: ReactNode; muted?: boolean }>
  note?: ReactNode
}

type RechartsTooltipProps = {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
}

/** Фабрика рендер-функции для пропа content у <Tooltip> (не компонент). */
export function chartTooltip<Row>(build: (row: Row) => ChartTooltipModel) {
  return function renderTooltip({ active, payload }: RechartsTooltipProps) {
    const row = payload?.[0]?.payload as Row | undefined
    if (!active || !row) return null
    const model = build(row)
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip__title">{model.title}</div>
        {model.rows.map((item, index) => (
          <div key={index} className={`chart-tooltip__row ${item.muted ? 'chart-tooltip__row--muted' : ''}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
        {model.note && <div className="chart-tooltip__note">{model.note}</div>}
      </div>
    )
  }
}
