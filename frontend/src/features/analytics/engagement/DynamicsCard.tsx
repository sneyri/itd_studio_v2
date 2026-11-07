/** Реальная динамика суммарных метрик по снимкам (post_metrics_snapshots). */
import { useId, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatDayLong, formatDayShort, formatNumber } from '@/shared/lib/format'
import { axisProps, Badge, chartColors, chartTooltip, ChartContainer, cursorLine, gridProps, Tabs } from '@/shared/ui'
import { useDynamics } from '../hooks'
import type { DynamicsPoint } from '../types'

type Metric = 'views' | 'likes' | 'comments' | 'reposts'

const METRICS: ReadonlyArray<{ value: Metric; label: string; shortLabel: string }> = [
  { value: 'views', label: 'Просмотры', shortLabel: 'Просм.' },
  { value: 'likes', label: 'Лайки', shortLabel: 'Лайки' },
  { value: 'comments', label: 'Комментарии', shortLabel: 'Комм.' },
  { value: 'reposts', label: 'Репосты', shortLabel: 'Реп.' },
]

const tooltip = chartTooltip<DynamicsPoint>((row) => ({
  title: `Снимок ${formatDayLong(row.date)}`,
  rows: [
    { label: 'Просмотры', value: formatNumber(row.views) },
    { label: 'Лайки', value: formatNumber(row.likes) },
    { label: 'Комментарии', value: formatNumber(row.comments) },
    { label: 'Репосты', value: formatNumber(row.reposts) },
  ],
  note: 'Сумма по всем постам на момент снимка',
}))

export function DynamicsCard({ height = 260 }: { height?: number }) {
  const { data, isPending, error, refetch } = useDynamics()
  const [metric, setMetric] = useState<Metric>('views')
  const gradientId = useId().replace(/:/g, '')
  const items = data?.items ?? []

  return (
    <ChartContainer
      title="Динамика по снимкам"
      subtitle="Как росли суммарные метрики всех постов между синхронизациями"
      badges={
        data && items.length >= 2 ? (
          <Badge tone="success">
            <span className="legend-dot legend-dot--solid" aria-hidden="true" />
            Реальные снимки{data.since ? ` с ${formatDayLong(data.since.slice(0, 10))}` : ''}
          </Badge>
        ) : undefined
      }
      actions={<Tabs size="sm" label="Метрика динамики" options={METRICS} value={metric} onChange={setMetric} />}
      height={height}
      loading={isPending}
      error={error}
      onRetry={() => void refetch()}
      empty={
        !isPending && items.length < 2
          ? {
              title: 'Снимков пока мало',
              description:
                'Снимки метрик копятся с момента внедрения: каждая синхронизация добавляет точку. Для графика нужна ещё хотя бы одна синхронизация в другой день.',
            }
          : null
      }
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={items} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.fill} stopOpacity={0.25} />
              <stop offset="100%" stopColor={chartColors.fill} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" tickFormatter={formatDayShort} minTickGap={24} {...axisProps} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={56} domain={['auto', 'auto']} {...axisProps} />
          <Tooltip content={tooltip} cursor={cursorLine} />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={chartColors.line}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: chartColors.line, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
