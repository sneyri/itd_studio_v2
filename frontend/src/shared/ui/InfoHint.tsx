/** Значок «i» с всплывающей подсказкой (по hover и по фокусу с клавиатуры). */
import { useId, type ReactNode } from 'react'
import { IconInfo } from './icons'

export function InfoHint({ children, label = 'Подробнее' }: { children: ReactNode; label?: string }) {
  const id = useId()
  return (
    <span className="info-hint">
      <button type="button" className="info-hint__trigger" aria-label={label} aria-describedby={id}>
        <IconInfo size={15} />
      </button>
      <span role="tooltip" id={id} className="info-hint__bubble">
        {children}
      </span>
    </span>
  )
}
