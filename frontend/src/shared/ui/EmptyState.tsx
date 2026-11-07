/** Честное пустое состояние: что не так и почему данных нет. */
import type { ReactNode } from 'react'
import { IconInbox } from './icons'

type EmptyStateProps = {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  compact?: boolean
}

export function EmptyState({ title, description, icon, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`state ${compact ? 'state--compact' : ''}`}>
      <span className="state__icon">{icon ?? <IconInbox />}</span>
      <p className="state__title">{title}</p>
      {description && <p className="state__description">{description}</p>}
      {action && <div className="state__action">{action}</div>}
    </div>
  )
}
