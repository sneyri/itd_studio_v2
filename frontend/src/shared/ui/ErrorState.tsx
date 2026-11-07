/** Состояние ошибки загрузки с кнопкой повтора. */
import { Button } from './Button'
import { IconAlert, IconRefresh } from './icons'

type ErrorStateProps = {
  error: unknown
  onRetry?: () => void
  title?: string
  compact?: boolean
}

function messageOf(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Неизвестная ошибка'
}

export function ErrorState({ error, onRetry, title = 'Не удалось загрузить данные', compact = false }: ErrorStateProps) {
  return (
    <div className={`state state--error ${compact ? 'state--compact' : ''}`} role="alert">
      <span className="state__icon">
        <IconAlert />
      </span>
      <p className="state__title">{title}</p>
      <p className="state__description">{messageOf(error)}</p>
      {onRetry && (
        <div className="state__action">
          <Button size="sm" variant="secondary" icon={<IconRefresh size={16} />} onClick={onRetry}>
            Повторить
          </Button>
        </div>
      )}
    </div>
  )
}
