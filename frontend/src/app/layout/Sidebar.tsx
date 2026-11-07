/** Левый сайдбар: логотип, разделы, помощь, карточка пользователя с выходом. */
import { NavLink } from 'react-router'
import { useLogout, useSession } from '@/features/auth/hooks'
import { Avatar, IconLogout } from '@/shared/ui'
import { Logo } from './Logo'
import { HELP_NAV, MAIN_NAV, type NavItem } from './navigation'

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to} end={item.end} className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}>
      <Icon size={20} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { profile } = useSession()
  const logout = useLogout()
  const name = profile?.display_name || profile?.username || ''

  return (
    <aside className="sidebar" aria-label="Основная навигация">
      <Logo />
      <nav className="sidebar__nav">
        {MAIN_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>
      <div className="sidebar__bottom">
        <SidebarLink item={HELP_NAV} />
        {profile && (
          <div className="sidebar__user">
            <Avatar avatar={profile.avatar} name={name} />
            <div className="sidebar__user-text">
              <span className="sidebar__user-name">{name}</span>
              <span className="sidebar__user-handle">@{profile.username}</span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              aria-label="Выйти из аккаунта"
              title="Выйти"
            >
              <IconLogout size={20} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
