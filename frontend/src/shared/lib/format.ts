/** Форматирование чисел, процентов и дат для интерфейса (ru-RU). */

const numberFormat = new Intl.NumberFormat('ru-RU')
const compactFormat = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 })

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return numberFormat.format(Math.round(value))
}

export function formatDecimal(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value)
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Math.abs(value) < 10000 ? formatNumber(value) : compactFormat.format(value)
}

/** Доля 0..1 → "13.30%" */
export function formatPercent(ratio: number | null | undefined, digits = 2): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—'
  return `${(ratio * 100).toFixed(digits)}%`
}

/** "YYYY-MM-DD" (день в поясе пользователя, уже посчитан бэкендом) → Date в полдень UTC, чтобы не съехать */
function dayToDate(day: string): Date {
  return new Date(`${day}T12:00:00Z`)
}

/** "2026-03-12" → "12 мар" */
export function formatDayShort(day: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(dayToDate(day))
    .replace('.', '')
}

/** "2026-03-12" → "12 марта 2026" */
export function formatDayLong(day: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    dayToDate(day),
  )
}

function safeTimeZone(timeZone?: string): string | undefined {
  if (!timeZone) return undefined
  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone })
    return timeZone
  } catch {
    return undefined
  }
}

/** ISO UTC → "12 мар 2026, 14:05" в поясе пользователя */
export function formatDateTime(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: safeTimeZone(timeZone),
  }).format(date)
}

/** ISO UTC → "12 мар 2026" */
export function formatDate(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: safeTimeZone(timeZone),
  }).format(date)
}

/** ISO UTC → "5 мин назад" / "вчера" / дата */
export function formatRelative(iso: string | null | undefined, timeZone?: string): string {
  if (!iso) return 'никогда'
  const date = new Date(iso)
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000)
  if (Number.isNaN(diffSec)) return '—'
  if (diffSec < 45) return 'только что'
  const rtf = new Intl.RelativeTimeFormat('ru-RU', { numeric: 'auto' })
  if (diffSec < 3600) return rtf.format(-Math.round(diffSec / 60), 'minute')
  if (diffSec < 86400) return rtf.format(-Math.round(diffSec / 3600), 'hour')
  if (diffSec < 86400 * 7) return rtf.format(-Math.round(diffSec / 86400), 'day')
  return formatDate(iso, timeZone)
}

/** секунды → "через 5 мин" */
export function formatWait(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return 'чуть позже'
  if (seconds < 60) return `через ${Math.ceil(seconds)} с`
  return `через ${Math.ceil(seconds / 60)} мин`
}

/** Склонение: plural(5, ['пост', 'поста', 'постов']) */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}
