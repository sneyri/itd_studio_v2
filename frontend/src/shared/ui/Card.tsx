/** Базовая карточка-поверхность. */
import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'section' | 'div' | 'article'
  padding?: 'none' | 'md' | 'lg'
  interactive?: boolean
  children: ReactNode
}

export function Card({ as: Tag = 'section', padding = 'lg', interactive = false, className, children, ...rest }: CardProps) {
  const classes = ['card', `card--pad-${padding}`, interactive ? 'card--interactive' : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
