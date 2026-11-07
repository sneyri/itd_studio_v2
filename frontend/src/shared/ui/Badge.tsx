/** Бейдж-метка (например, источник данных графика). */
import type { ReactNode } from 'react'

type BadgeProps = {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  icon?: ReactNode
  title?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', icon, title, children }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`} title={title}>
      {icon}
      {children}
    </span>
  )
}
