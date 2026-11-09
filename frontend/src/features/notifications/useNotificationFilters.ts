/**
 * Фильтры уведомлений живут в URL (?types=like&verified=true&actor=…), поэтому ссылкой
 * можно поделиться, а «Назад» в браузере возвращает предыдущий фильтр.
 */
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { NotificationFilters, NotificationsSort, VerifiedFilter } from './types'

const SORTS: NotificationsSort[] = ['new', 'old', 'actor']
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const EMPTY_FILTERS: NotificationFilters = {
  types: [],
  actor: '',
  verified: '',
  unread: false,
  q: '',
  date_from: '',
  date_to: '',
  sort: 'new',
}

function parse(params: URLSearchParams): NotificationFilters {
  const verified = params.get('verified')
  const sort = params.get('sort') as NotificationsSort | null
  const date = (key: string) => {
    const value = params.get(key) ?? ''
    return DATE_RE.test(value) ? value : ''
  }
  return {
    types: [...new Set(params.getAll('types').filter(Boolean))],
    actor: params.get('actor') ?? '',
    verified: verified === 'true' || verified === 'false' ? (verified as VerifiedFilter) : '',
    unread: params.get('unread') === 'true',
    q: params.get('q') ?? '',
    date_from: date('date_from'),
    date_to: date('date_to'),
    sort: sort && SORTS.includes(sort) ? sort : 'new',
  }
}

function serialize(filters: NotificationFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const type of filters.types) params.append('types', type)
  if (filters.actor) params.set('actor', filters.actor)
  if (filters.verified) params.set('verified', filters.verified)
  if (filters.unread) params.set('unread', 'true')
  if (filters.q) params.set('q', filters.q)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.sort !== 'new') params.set('sort', filters.sort)
  return params
}

export function countActiveFilters(filters: NotificationFilters): number {
  return (
    (filters.types.length ? 1 : 0) +
    (filters.actor ? 1 : 0) +
    (filters.verified ? 1 : 0) +
    (filters.unread ? 1 : 0) +
    (filters.q.trim() ? 1 : 0) +
    (filters.date_from || filters.date_to ? 1 : 0)
  )
}

export function useNotificationFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => parse(params), [params])

  const update = useCallback(
    (patch: Partial<NotificationFilters>, options: { replace?: boolean } = {}) => {
      setParams((prev) => serialize({ ...parse(prev), ...patch }), { replace: options.replace ?? false })
    },
    [setParams],
  )

  const reset = useCallback(() => setParams(new URLSearchParams()), [setParams])

  return { filters, update, reset, activeCount: countActiveFilters(filters) }
}
