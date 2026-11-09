/**
 * Панель фильтров уведомлений: поиск по тексту (debounce 300 мс), типы (мультивыбор),
 * автор (список с поиском по серверу), верификация, период, только непрочитанные, сортировка.
 * На узких экранах всё, кроме поиска, сворачивается под кнопку «Фильтры».
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatNumber } from '@/shared/lib/format'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import {
  Avatar,
  Button,
  Card,
  IconClose,
  IconFilter,
  IconSearch,
  Input,
  MultiSelect,
  Select,
  VerifiedBadge,
  type SelectOption,
} from '@/shared/ui'
import { useNotificationActors, useNotificationsSummary } from './hooks'
import { KNOWN_NOTIFICATION_TYPES, notificationMeta } from './notificationTypes'
import type { NotificationFilters, NotificationsSort, VerifiedFilter } from './types'

type Props = {
  filters: NotificationFilters
  activeCount: number
  update: (patch: Partial<NotificationFilters>, options?: { replace?: boolean }) => void
  reset: () => void
}

const SORT_OPTIONS: ReadonlyArray<SelectOption<NotificationsSort>> = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'old', label: 'Сначала старые' },
  { value: 'actor', label: 'По пользователю (А→Я)' },
]

const VERIFIED_OPTIONS: ReadonlyArray<SelectOption<VerifiedFilter>> = [
  { value: '', label: 'Все пользователи' },
  { value: 'true', label: 'Только верифицированные', icon: <VerifiedBadge verified size={15} /> },
  { value: 'false', label: 'Без галочки верификации' },
]

function SearchField({ value, onCommit }: { value: string; onCommit: (q: string) => void }) {
  const [text, setText] = useState(value)
  const debounced = useDebouncedValue(text, 300)
  // коммитим только изменения ввода; актуальные value/onCommit держим в ref
  const latest = useRef({ value, onCommit })
  useEffect(() => {
    latest.current = { value, onCommit }
  })

  useEffect(() => {
    if (debounced !== latest.current.value) latest.current.onCommit(debounced)
  }, [debounced])

  return (
    <Input
      label="Поиск"
      type="search"
      placeholder="Текст, имя или @username"
      value={text}
      onChange={(event) => setText(event.target.value)}
      autoComplete="off"
      trailing={<IconSearch size={18} className="muted" />}
    />
  )
}

export function NotificationFiltersPanel({ filters, activeCount, update, reset }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [actorQuery, setActorQuery] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const debouncedActorQuery = useDebouncedValue(actorQuery, 250)
  const actors = useNotificationActors(debouncedActorQuery)
  const summary = useNotificationsSummary()

  const typeOptions = useMemo<SelectOption[]>(() => {
    const counts = new Map(summary.data?.by_type.map((t) => [t.type, t.count]))
    const types = [...new Set([...(summary.data?.by_type.map((t) => t.type) ?? []), ...KNOWN_NOTIFICATION_TYPES])]
    return types.map((type) => {
      const meta = notificationMeta(type)
      const count = counts.get(type)
      return { value: type, label: meta.label, icon: meta.icon, meta: count ? formatNumber(count) : undefined }
    })
  }, [summary.data])

  const actorOptions = useMemo<SelectOption[]>(() => {
    const items = actors.data?.items ?? []
    const options: SelectOption[] = items.map((a) => ({
      value: a.username,
      label: a.display_name || a.username,
      hint: `@${a.username}`,
      icon: <Avatar avatar={a.avatar} name={a.display_name ?? a.username} size={26} />,
      meta: formatNumber(a.count),
      keywords: a.username,
    }))
    if (filters.actor && !items.some((a) => a.username === filters.actor)) {
      options.unshift({ value: filters.actor, label: `@${filters.actor}` })
    }
    return options
  }, [actors.data, filters.actor])

  const verifiedByUsername = useMemo(
    () => new Map(actors.data?.items.map((a) => [a.username, a.is_verified])),
    [actors.data],
  )

  const resetAll = () => {
    reset()
    setSearchKey((k) => k + 1)
  }

  return (
    <Card className="notif-filters">
      <div className="notif-filters__top">
        <div className="notif-filters__search">
          <SearchField key={searchKey} value={filters.q} onCommit={(q) => update({ q }, { replace: true })} />
        </div>
        <Button
          className="notif-filters__toggle"
          icon={<IconFilter size={16} />}
          aria-expanded={expanded}
          aria-controls="notif-filters-body"
          onClick={() => setExpanded((v) => !v)}
        >
          Фильтры{activeCount > 0 ? ` · ${activeCount}` : ''}
        </Button>
      </div>

      <div id="notif-filters-body" className={`notif-filters__body ${expanded ? 'notif-filters__body--open' : ''}`}>
        <MultiSelect
          label="Тип"
          placeholder="Все типы"
          options={typeOptions}
          value={filters.types}
          onChange={(types) => update({ types })}
        />
        <Select
          label="От пользователя"
          placeholder="Любой пользователь"
          options={actorOptions}
          value={filters.actor || null}
          onChange={(actor) => update({ actor })}
          onClear={() => update({ actor: '' })}
          searchable
          searchPlaceholder="Имя или @username"
          onSearchChange={setActorQuery}
          loading={actors.isFetching}
          emptyText={actorQuery ? 'Никого не нашли' : 'Пока нет авторов'}
          renderValue={(option) => (
            <>
              {option.icon && <span className="dropdown__value-icon">{option.icon}</span>}
              <span className="dropdown__value-text">{option.label}</span>
              <VerifiedBadge verified={verifiedByUsername.get(option.value)} size={14} />
            </>
          )}
        />
        <Select
          label="Верификация"
          options={VERIFIED_OPTIONS}
          value={filters.verified}
          onChange={(verified) => update({ verified })}
        />
        <Select label="Сортировка" options={SORT_OPTIONS} value={filters.sort} onChange={(sort) => update({ sort })} />
        <Input
          label="С даты"
          type="date"
          value={filters.date_from}
          max={filters.date_to || undefined}
          onChange={(event) => update({ date_from: event.target.value }, { replace: true })}
        />
        <Input
          label="По дату"
          type="date"
          value={filters.date_to}
          min={filters.date_from || undefined}
          onChange={(event) => update({ date_to: event.target.value }, { replace: true })}
        />
        <div className="notif-filters__actions">
          <label className="switch">
            <input type="checkbox" checked={filters.unread} onChange={(event) => update({ unread: event.target.checked })} />
            Только непрочитанные
          </label>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" icon={<IconClose size={14} />} onClick={resetAll}>
              Сбросить ({activeCount})
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
