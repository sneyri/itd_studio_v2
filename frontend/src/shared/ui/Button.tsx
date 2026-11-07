/** Кнопка в трёх вариантах: primary (залитая), secondary (контурная), ghost (текстовая). */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  block = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block ? 'btn--block' : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <Spinner size={16} /> : icon}
      {children !== undefined && <span className="btn__label">{children}</span>}
    </button>
  )
}
