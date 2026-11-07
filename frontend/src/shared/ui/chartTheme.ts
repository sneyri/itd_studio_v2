/**
 * Общие настройки графиков Recharts. Цвета — CSS-переменные темы,
 * поэтому графики перекрашиваются при смене темы без перерисовки данных.
 */
export const chartColors = {
  line: 'var(--color-chart-line)',
  fill: 'var(--color-chart-fill)',
  bar: 'var(--color-chart-bar)',
  barMuted: 'var(--color-chart-bar-muted)',
  secondary: 'var(--color-chart-secondary)',
  grid: 'var(--color-chart-grid)',
  axis: 'var(--color-chart-axis)',
  surface: 'var(--color-card)',
} as const

export const axisTick = { fill: chartColors.axis, fontSize: 12 } as const

export const axisProps = {
  tick: axisTick,
  tickLine: false,
  axisLine: false,
} as const

export const gridProps = {
  stroke: chartColors.grid,
  vertical: false,
} as const

export const cursorFill = { fill: 'var(--color-accent-soft)' } as const
export const cursorLine = { stroke: chartColors.axis, strokeDasharray: '3 3' } as const
