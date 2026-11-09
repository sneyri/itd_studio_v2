/**
 * Сводка по уведомлениям: цифры, график по дням (30 дней), разбивка по типам
 * (чипы = быстрый фильтр) и самые активные пользователи (клик = фильтр по автору).
 */
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { formatDayLong, formatDayShort, formatDate, formatNumber } from '@/shared/lib/format'
import {
  Avatar,
  axisProps,
  Card,
  chartColors,
  chartTooltip,
  cursorFill,
  EmptyState,
  ErrorState,
  IconBell,
  IconInbox,
  IconVerified,
  MetricCard,
  Skeleton,
  VerifiedBadge,
} from '@/shared/ui'
import { useNotificationsSummary } from './hooks'
import { notificationMeta } from './notificationTypes'
import type { NotificationsSummary as Summary } from './types'

type Props = {
  activeTypes: string[]
  activeActor: string
  onToggleType: (type: string) => void
  onSelectActor: (username: string) => void
}

const dayTooltip = chartTooltip<Summary['by_day'][number]>((row) => ({
  title: formatDayLong(row.date),
  rows: [{ label: 'Уведомлений', value: formatNumber(row.count) }],
}))

export function NotificationsSummaryMetrics() {
  const { data, isPending } = useNotificationsSummary()
  const last30 = data?.by_day.reduce((sum, d) => sum + d.count, 0)
  return (
    <div className="metrics-grid">
      <MetricCard
        loading={isPending}
        icon={<IconBell />}
        label="Всего уведомлений"
        value={formatNumber(data?.total)}
        hint={data?.since ? `с ${formatDate(data.since)}` : undefined}
      />
      <MetricCard loading={isPending} icon={<IconInbox />} label="Непрочитанных" value={formatNumber(data?.unread)} />
      <MetricCard
        loading={isPending}
        icon={<IconVerified />}
        label="От верифицированных"
        value={formatNumber(data?.verified.verified)}
        hint={
          data
            ? `нет галочки: ${formatNumber(data.verified.not_verified)} · неизвестно: ${formatNumber(data.verified.unknown)}`
            : undefined
        }
      />
      <MetricCard loading={isPending} icon={<IconBell />} label="За 30 дней" value={formatNumber(last30)} />
    </div>
  )
}

export function NotificationsSummaryPanel({ activeTypes, activeActor, onToggleType, onSelectActor }: Props) {
  const { data, isPending, error, refetch } = useNotificationsSummary()

  if (isPending) {
    return (
      <Card className="list-card">
        <Skeleton height={140} radius="var(--radius-lg)" />
        <Skeleton height={32} />
      </Card>
    )
  }
  if (error || !data) {
    return (
      <Card className="list-card">
        <ErrorState error={error} onRetry={() => void refetch()} compact />
      </Card>
    )
  }
  if (data.total === 0) return null

  const hasDays = data.by_day.some((d) => d.count > 0)

  return (
    <div className="grid grid--main-side">
      <Card className="list-card">
        <header className="list-card__header">
          <h2 className="chart-card__title">Активность за 30 дней</h2>
          <p className="chart-card__subtitle">Нажмите на тип, чтобы отфильтровать список</p>
        </header>
        {hasDays ? (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.by_day} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tickFormatter={formatDayShort} minTickGap={24} {...axisProps} />
              <Tooltip content={dayTooltip} cursor={cursorFill} />
              <Bar dataKey="count" fill={chartColors.bar} radius={[6, 6, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState compact title="За 30 дней уведомлений нет" description="Сохранённые уведомления старше месяца." />
        )}
        <div className="chips" role="group" aria-label="Фильтр по типу">
          {data.by_type.map((item) => {
            const meta = notificationMeta(item.type)
            const active = activeTypes.includes(item.type)
            return (
              <button
                key={item.type}
                type="button"
                className={`chip ${active ? 'chip--active' : ''}`}
                aria-pressed={active}
                onClick={() => onToggleType(item.type)}
              >
                {meta.icon}
                {meta.label}
                <span className="chip__count">{formatNumber(item.count)}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="list-card">
        <header className="list-card__header">
          <h2 className="chart-card__title">Самые активные</h2>
          <p className="chart-card__subtitle">Топ-10 по числу уведомлений · нажмите, чтобы показать только их</p>
        </header>
        {data.top_actors.length === 0 ? (
          <EmptyState compact title="Нет данных об авторах" />
        ) : (
          <ol className="actor-rank">
            {data.top_actors.map((actor, index) => {
              const active = activeActor === actor.username
              return (
                <li key={actor.username}>
                  <button
                    type="button"
                    className={`actor-rank__item ${active ? 'actor-rank__item--active' : ''}`}
                    aria-pressed={active}
                    onClick={() => onSelectActor(active ? '' : actor.username)}
                  >
                    <span className="actor-rank__index">{index + 1}</span>
                    <Avatar avatar={actor.avatar} name={actor.display_name ?? actor.username} size={32} />
                    <span className="actor-rank__name">
                      <span className="actor-rank__display">
                        {actor.display_name || actor.username}
                        <VerifiedBadge verified={actor.is_verified} size={14} />
                      </span>
                      <span className="actor-rank__username">@{actor.username}</span>
                    </span>
                    <span className="actor-rank__count">{formatNumber(actor.count)}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
      </Card>
    </div>
  )
}
