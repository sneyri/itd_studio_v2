/**
 * График подписчиков. Точки из снимков — залитые, восстановленные по уведомлениям — полые.
 * Никакой интерполяции: дни без данных просто отсутствуют в ряде.
 */
import { useId } from 'react'
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDayLong, formatDayShort, formatNumber } from '@/shared/lib/format'
import { axisProps, chartColors, chartTooltip, cursorLine, gridProps } from '@/shared/ui'
import type { FollowersPoint } from '../types'

type FollowersChartProps = {
  points: FollowersPoint[]
  height?: number
  /** Показывать столбики «новые подписчики за день» */
  showDaily?: boolean
}

const SOURCE_LABEL: Record<FollowersPoint['source'], string> = {
  snapshot: 'снимок',
  notifications: 'по уведомлениям',
}

const tooltip = chartTooltip<FollowersPoint>((row) => ({
  title: formatDayLong(row.date),
  rows: [
    { label: 'Подписчики', value: formatNumber(row.followers) },
    { label: 'Новые за день', value: row.new_followers === null ? 'нет данных' : `+${formatNumber(row.new_followers)}` },
    { label: 'Источник', value: SOURCE_LABEL[row.source], muted: true },
  ],
  note: row.source === 'notifications' ? 'Оценка: отписки итд не отдаёт' : undefined,
}))

type DotProps = { cx?: number; cy?: number; payload?: FollowersPoint; index?: number }

export function FollowersChart({ points, height = 260, showDaily = false }: FollowersChartProps) {
  const gradientId = useId().replace(/:/g, '')
  const showAllDots = points.length <= 60

  const renderDot = ({ cx, cy, payload, index }: DotProps) => {
    if (cx === undefined || cy === undefined || !payload) return <g key={`dot-${index}`} />
    if (payload.source === 'snapshot') {
      return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3.5} fill={chartColors.line} stroke={chartColors.line} />
    }
    if (!showAllDots) return <g key={`dot-${index}`} />
    return (
      <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill={chartColors.surface} stroke={chartColors.line} strokeWidth={1.5} />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.fill} stopOpacity={0.28} />
            <stop offset="100%" stopColor={chartColors.fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" tickFormatter={formatDayShort} minTickGap={24} {...axisProps} />
        <YAxis
          yAxisId="total"
          tickFormatter={(v: number) => formatNumber(v)}
          width={56}
          allowDecimals={false}
          domain={['auto', 'auto']}
          {...axisProps}
        />
        {showDaily && <YAxis yAxisId="daily" orientation="right" hide allowDecimals={false} />}
        <Tooltip content={tooltip} cursor={cursorLine} />
        {showDaily && (
          <Bar yAxisId="daily" dataKey="new_followers" fill={chartColors.barMuted} radius={[4, 4, 0, 0]} maxBarSize={14} />
        )}
        <Area
          yAxisId="total"
          type="monotone"
          dataKey="followers"
          stroke={chartColors.line}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={renderDot}
          activeDot={{ r: 5, fill: chartColors.line, stroke: chartColors.surface, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
