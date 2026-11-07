/**
 * Средние просмотры/взаимодействия по часу публикации (в часовом поясе пользователя).
 * Часы с малой выборкой показаны приглушённо и не участвуют в выборе лучшего времени.
 */
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatNumber, plural } from '@/shared/lib/format'
import { axisProps, Badge, chartColors, chartTooltip, ChartContainer, cursorFill, gridProps, Tabs } from '@/shared/ui'
import { usePostingTime } from '../hooks'
import type { PostingTimeBucket } from '../types'

type Metric = 'avg_views' | 'avg_interactions'

const METRICS: ReadonlyArray<{ value: Metric; label: string; shortLabel: string }> = [
  { value: 'avg_views', label: 'Ср. просмотры', shortLabel: 'Просм.' },
  { value: 'avg_interactions', label: 'Ср. взаимодействия', shortLabel: 'Взаим.' },
]

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`

const tooltip = chartTooltip<PostingTimeBucket>((row) => ({
  title: `${hourLabel(row.hour)} – ${hourLabel((row.hour + 1) % 24)}`,
  rows: [
    { label: 'Постов', value: formatNumber(row.posts) },
    { label: 'Ср. просмотры', value: formatNumber(row.avg_views) },
    { label: 'Ср. взаимодействия', value: formatNumber(row.avg_interactions) },
  ],
  note: row.sufficient ? undefined : 'Мало постов в этом часе — значение ненадёжно',
}))

export function PostingTimeCard({ height = 260 }: { height?: number }) {
  const { data, isPending, error, refetch } = usePostingTime()
  const [metric, setMetric] = useState<Metric>('avg_views')
  const buckets = data?.buckets ?? []
  const bestHour = data?.best.sufficient_data ? data.best.hour : null
  const hasPosts = buckets.some((b) => b.posts > 0)

  return (
    <ChartContainer
      title="Время публикации"
      subtitle={data ? `Часовой пояс: ${data.timezone}` : undefined}
      badges={
        data ? (
          <>
            {data.best.sufficient_data && data.best.label ? (
              <Badge tone="success">Лучшее: {data.best.label}</Badge>
            ) : (
              <Badge tone="warning">{data.best.reason ?? 'Недостаточно данных'}</Badge>
            )}
            <Badge>
              <span className="legend-dot legend-dot--muted" aria-hidden="true" />
              меньше {data.min_posts_per_bucket} {plural(data.min_posts_per_bucket, ['поста', 'постов', 'постов'])} в часе — мало данных
            </Badge>
          </>
        ) : undefined
      }
      actions={<Tabs size="sm" label="Метрика по часам" options={METRICS} value={metric} onChange={setMetric} />}
      height={height}
      loading={isPending}
      error={error}
      onRetry={() => void refetch()}
      empty={!isPending && !hasPosts ? { title: 'Нет постов', description: 'Распределение по часам появится после синхронизации.' } : null}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={buckets} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="hour" tickFormatter={(h: number) => String(h).padStart(2, '0')} interval="preserveStartEnd" minTickGap={8} {...axisProps} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={56} {...axisProps} />
          <Tooltip content={tooltip} cursor={cursorFill} />
          <Bar dataKey={metric} radius={[6, 6, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {buckets.map((bucket) => (
              <Cell
                key={bucket.hour}
                fill={bucket.sufficient ? chartColors.bar : chartColors.barMuted}
                fillOpacity={bestHour === null || bucket.hour === bestHour || !bucket.sufficient ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
