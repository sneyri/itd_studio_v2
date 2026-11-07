/** «Активность» — столбцы по дням недели публикации (в часовом поясе пользователя). */
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { WEEKDAYS_LONG, WEEKDAYS_SHORT } from '@/shared/lib/constants'
import { formatCompact, formatNumber } from '@/shared/lib/format'
import { axisProps, chartColors, chartTooltip, ChartContainer, cursorFill, gridProps, Tabs } from '@/shared/ui'
import { useWeekdays } from '../hooks'
import type { WeekdayActivity } from '../types'

type Metric = 'interactions' | 'views' | 'posts'

const METRICS: ReadonlyArray<{ value: Metric; label: string; shortLabel: string }> = [
  { value: 'interactions', label: 'Взаимодействия', shortLabel: 'Взаим.' },
  { value: 'views', label: 'Просмотры', shortLabel: 'Просм.' },
  { value: 'posts', label: 'Посты', shortLabel: 'Посты' },
]

const tooltip = chartTooltip<WeekdayActivity>((row) => ({
  title: WEEKDAYS_LONG[row.weekday] ?? '',
  rows: [
    { label: 'Взаимодействия', value: formatNumber(row.interactions) },
    { label: 'Просмотры', value: formatNumber(row.views) },
    { label: 'Постов', value: formatNumber(row.posts) },
  ],
  note: 'Сумма по постам, опубликованным в этот день недели',
}))

export function WeekdayActivityCard({ height = 260 }: { height?: number }) {
  const { data, isPending, error, refetch } = useWeekdays()
  const [metric, setMetric] = useState<Metric>('interactions')
  const items = data?.items ?? []
  const hasData = items.some((i) => i.posts > 0)

  return (
    <ChartContainer
      title="Активность"
      subtitle="По дням недели публикации"
      actions={<Tabs size="sm" label="Метрика активности" options={METRICS} value={metric} onChange={setMetric} />}
      height={height}
      loading={isPending}
      error={error}
      onRetry={() => void refetch()}
      empty={!isPending && !hasData ? { title: 'Нет постов', description: 'Активность появится после синхронизации.' } : null}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={items} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="weekday" tickFormatter={(d: number) => WEEKDAYS_SHORT[d] ?? ''} {...axisProps} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={56} allowDecimals={false} {...axisProps} />
          <Tooltip content={tooltip} cursor={cursorFill} />
          <Bar dataKey={metric} fill={chartColors.bar} radius={[10, 10, 0, 0]} maxBarSize={56} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
