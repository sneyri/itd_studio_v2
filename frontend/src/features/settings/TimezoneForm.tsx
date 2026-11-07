/** Выбор часового пояса, в котором считаются дни и часы публикаций. */
import { useMemo, useState, type FormEvent } from 'react'
import { listTimezones } from '@/shared/lib/constants'
import { Button, ErrorState, Select, Skeleton } from '@/shared/ui'
import { useSettings, useUpdateSettings } from './hooks'

export function TimezoneForm() {
  const { data, isPending, error, refetch } = useSettings()
  const update = useUpdateSettings()
  const [draft, setDraft] = useState<string | null>(null)
  const timezones = useMemo(() => listTimezones(), [])

  if (isPending) return <Skeleton height={44} />
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} compact />

  const value = draft ?? data.timezone
  const options = timezones.includes(data.timezone) ? timezones : [data.timezone, ...timezones]
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
        value={value}
        onChange={(event) => setDraft(event.target.value)}
        hint={`Влияет на «лучшее время», дни недели и группировку по дням. Пояс браузера: ${browserTz}.`}
        error={update.error ? update.error.message : undefined}
      >
        {options.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replace(/_/g, ' ')}
          </option>
        ))}
      </Select>
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
