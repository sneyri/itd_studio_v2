/** Уведомления: сводка, быстрые фильтры (типы, активные пользователи), панель фильтров и список. */
import { NotificationFiltersPanel } from '@/features/notifications/NotificationFiltersPanel'
import { NotificationsList } from '@/features/notifications/NotificationsList'
import { NotificationsSummaryMetrics, NotificationsSummaryPanel } from '@/features/notifications/NotificationsSummary'
import { useNotificationFilters } from '@/features/notifications/useNotificationFilters'

export default function NotificationsPage() {
  const { filters, update, reset, activeCount } = useNotificationFilters()

  const toggleType = (type: string) =>
    update({ types: filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type] })
  const selectActor = (actor: string) => update({ actor })

  return (
    <div className="page">
      <NotificationsSummaryMetrics />
      <NotificationsSummaryPanel
        activeTypes={filters.types}
        activeActor={filters.actor}
        onToggleType={toggleType}
        onSelectActor={selectActor}
      />
      <NotificationFiltersPanel filters={filters} activeCount={activeCount} update={update} reset={reset} />
      <NotificationsList filters={filters} activeCount={activeCount} onReset={reset} onSelectActor={selectActor} />
    </div>
  )
}
