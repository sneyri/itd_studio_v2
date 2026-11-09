/** Выбор часового пояса, в котором считаются дни и часы публикаций (список с поиском). */
import { useMemo, useState, type FormEvent } from 'react'
import { listTimezones } from '@/shared/lib/constants'
import { Button, ErrorState, Select, Skeleton, type SelectOption } from '@/shared/ui'
import { useSettings, useUpdateSettings } from './hooks'

/** "Europe/Moscow" → "GMT+3" (текущее смещение с учётом летнего времени) */
function utcOffset(timeZone: string): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(new Date())
      .find((p) => p.type === 'timeZoneName')
    return part?.value.replace('GMT', 'UTC') ?? ''
  } catch {
    return ''
  }
}

function toOption(tz: string): SelectOption {
  const label = tz.replace(/_/g, ' ')
  const offset = utcOffset(tz)
  return { value: tz, label, meta: offset || undefined, keywords: `${offset} ${tz.split('/').pop() ?? ''}` }
}

export function TimezoneForm() {
  const { data, isPending, error, refetch } = useSettings()
  const update = useUpdateSettings()
  const [draft, setDraft] = useState<string | null>(null)
  const options = useMemo(() => listTimezones().map(toOption), [])

  if (isPending) return <Skeleton height={44} />
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} compact />

  const value = draft ?? data.timezone
  const allOptions = options.some((o) => o.value === data.timezone) ? options : [toOption(data.timezone), ...options]
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const changed = value !== data.timezone

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    update.mutate({ timezone: value }, { onSuccess: () => setDraft(null) })
  }

  return (
    <form className="settings-form" onSubmit={onSubmit}>
      <Select
        label="Часовой пояс"
        options={allOptions}
        value={value}
        onChange={setDraft}
        searchable
        searchPlaceholder="Город или UTC+3"
        renderValue={(option) => (
          <>
            <span className="dropdown__value-text">{option.label}</span>
            {option.meta && <span className="muted">{option.meta}</span>}
          </>
        )}
        hint={`Влияет на «лучшее время», дни недели и группировку по дням. Пояс браузера: ${browserTz}.`}
        error={update.error ? update.error.message : undefined}
      />
      <div className="settings-form__actions">
        <Button type="submit" variant="primary" loading={update.isPending} disabled={!changed}>
          Сохранить
        </Button>
        {browserTz && browserTz !== value && (
          <Button variant="ghost" onClick={() => setDraft(browserTz)}>
            Как в браузере
          </Button>
        )}
        {update.isSuccess && !changed && <span className="settings-form__saved">Сохранено</span>}
      </div>
    </form>
  )
}
