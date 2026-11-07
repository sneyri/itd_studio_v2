/**
 * Метрики постов, сгруппированные по ДНЮ ПУБЛИКАЦИИ. Это не рост во времени:
 * столбец за 12 марта — сколько набрали посты, опубликованные 12 марта, на момент синхронизации.
 */
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact, formatDayLong, formatDayShort, formatNumber } from '@/shared/lib/format'
import { axisProps, Badge, chartColors, chartTooltip, ChartContainer, cursorFill, gridProps, Tabs } from '@/shared/ui'
import { usePublicationDays } from '../hooks'
import type { PublicationDay } from '../types'

type Metric = 'views' | 'likes' | 'comments' | 'reposts' | 'posts'
type Range = '30' | '90' | 'all'

const METRICS: ReadonlyArray<{ value: Metric; label: string; shortLabel: string }> = [
  { value: 'views', label: 'Просмотры', shortLabel: 'Просм.' },
  { value: 'likes', label: 'Лайки', shortLabel: 'Лайки' },
  { value: 'comments', label: 'Комментарии', shortLabel: 'Комм.' },
  { value: 'reposts', label: 'Репосты', shortLabel: 'Реп.' },
  { value: 'posts', label: 'Посты', shortLabel: 'Посты' },
]

const RANGES: ReadonlyArray<{ value: Range; label: string }> = [
  { value: '30', label: '30 дн' },
  { value: '90', label: '90 дн' },
  { value: 'all', label: 'Всё' },
]

const tooltip = chartTooltip<PublicationDay>((row) => ({
  title: `Опубликовано ${formatDayLong(row.date)}`,
  rows: [
    { label: 'Постов', value: formatNumber(row.posts) },
    { label: 'Просмотры', value: formatNumber(row.views) },
    { label: 'Лайки', value: formatNumber(row.likes) },
    { label: 'Комментарии', value: formatNumber(row.comments) },
    { label: 'Репосты', value: formatNumber(row.reposts) },
  ],
}))

export function PublicationDayCard({ height = 280 }: { height?: number }) {
  const { data, isPending, error, refetch } = usePublicationDays()
  const [metric, setMetric] = useState<Metric>('views')
  const [range, setRange] = useState<Range>('90')

  const items = useMemo(() => {
    const all = data?.items ?? []
    if (range === 'all' || all.length === 0) return all
    const last = new Date(`${all[all.length - 1].date}T00:00:00Z`)
    last.setUTCDate(last.getUTCDate() - Number(range) + 1)
    const from = last.toISOString().slice(0, 10)
    return all.filter((d) => d.date >= from)
  }, [data, range])

  return (
    <ChartContainer
      title="Метрики постов по дню публикации"
      subtitle="Сумма метрик постов, опубликованных в этот день. Это не рост во времени."
      badges={
        data ? (
          <Badge tone="accent" title="Источник: метрики постов на момент последней синхронизации">
            по дате публикации · {data.timezone}
          </Badge>
        ) : undefined
      }
      actions={
        <>
          <Tabs size="sm" label="Метрика" options={METRICS} value={metric} onChange={setMetric} />
          <Tabs size="sm" label="Период" options={RANGES} value={range} onChange={setRange} />
        </>
      }
      hideActionsWhenEmpty={false}
      height={height}
      loading={isPending}
      error={error}
      onRetry={() => void refetch()}
      empty={!isPending && items.length === 0 ? { title: 'Нет постов за период', description: 'Выберите больший период или синхронизируйте данные.' } : null}
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={items} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" tickFormatter={formatDayShort} minTickGap={24} {...axisProps} />
          <YAxis tickFormatter={(v: number) => formatCompact(v)} width={56} allowDecimals={false} {...axisProps} />
          <Tooltip content={tooltip} cursor={cursorFill} />
          <Bar dataKey={metric} fill={chartColors.bar} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
