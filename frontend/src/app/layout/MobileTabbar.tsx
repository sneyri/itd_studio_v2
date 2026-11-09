/**
 * Нижний таб-бар для узких экранов (заменяет сайдбар): 4 главных раздела + «Ещё»
 * с остальными (Аудитория, Настройки, Помощь). Так на 360px нет горизонтального скролла.
 */
import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { IconMore } from '@/shared/ui'
import { HELP_NAV, MAIN_NAV, TABBAR_PRIMARY } from './navigation'

const PRIMARY = MAIN_NAV.filter((item) => TABBAR_PRIMARY.includes(item.to))
const SECONDARY = [...MAIN_NAV.filter((item) => !TABBAR_PRIMARY.includes(item.to)), HELP_NAV]

export function MobileTabbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const secondaryActive = SECONDARY.some((item) => pathname.startsWith(item.to))

  // закрываем меню при переходе на другую страницу
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <nav className="tabbar" aria-label="Навигация">
      {PRIMARY.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `tabbar__link ${isActive ? 'tabbar__link--active' : ''}`}
            aria-label={item.label}
          >
            <Icon size={22} />
            <span>{item.shortLabel ?? item.label}</span>
          </NavLink>
        )
      })}
      <button
        ref={buttonRef}
        type="button"
        className={`tabbar__link ${secondaryActive || open ? 'tabbar__link--active' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="tabbar-more"
        onClick={() => setOpen((v) => !v)}
      >
        <IconMore size={22} />
        <span>Ещё</span>
      </button>
      {open && (
        <div ref={menuRef} id="tabbar-more" className="tabbar__menu" role="menu">
          {SECONDARY.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                role="menuitem"
                className={({ isActive }) => `tabbar__menu-item ${isActive ? 'tabbar__menu-item--active' : ''}`}
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </nav>
  )
}
