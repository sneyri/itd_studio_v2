/**
 * Полноэкранный просмотр картинок: Esc или клик по фону закрывают, ←/→ листают.
 * Пока открыт — прокрутка страницы заблокирована, фокус на кнопке закрытия.
 */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronLeft, IconChevronRight, IconClose } from './icons'

export type LightboxImage = { url: string; alt?: string }

type LightboxProps = {
  images: ReadonlyArray<LightboxImage>
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const count = images.length
  const current = images[index]

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previousFocus?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight' && count > 1) onIndexChange((index + 1) % count)
      else if (event.key === 'ArrowLeft' && count > 1) onIndexChange((index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, index, onClose, onIndexChange])

  if (!current) return null

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображения" onClick={onClose}>
      <button ref={closeRef} type="button" className="lightbox__btn lightbox__close" aria-label="Закрыть" onClick={onClose}>
        <IconClose size={22} />
      </button>
      {count > 1 && (
        <>
          <button
            type="button"
            className="lightbox__btn lightbox__nav lightbox__nav--prev"
            aria-label="Предыдущее"
            onClick={(event) => {
              event.stopPropagation()
              onIndexChange((index - 1 + count) % count)
            }}
          >
            <IconChevronLeft size={26} />
          </button>
          <button
            type="button"
            className="lightbox__btn lightbox__nav lightbox__nav--next"
            aria-label="Следующее"
            onClick={(event) => {
              event.stopPropagation()
              onIndexChange((index + 1) % count)
            }}
          >
            <IconChevronRight size={26} />
          </button>
          <span className="lightbox__counter">
            {index + 1} / {count}
          </span>
        </>
      )}
      <img
        key={current.url}
        className="lightbox__image"
        src={current.url}
        alt={current.alt ?? ''}
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  )
}
