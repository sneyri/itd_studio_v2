/** Нижний таб-бар для узких экранов (заменяет сайдбар). */
import { NavLink } from 'react-router'
import { MAIN_NAV } from './navigation'

export function MobileTabbar() {
  return (
    <nav className="tabbar" aria-label="Навигация">
      {MAIN_NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `tabbar__link ${isActive ? 'tabbar__link--active' : ''}`}
          >
            <Icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
