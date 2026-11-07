/** Пункты навигации (сайдбар, нижний таб-бар) и заголовки страниц. */
import type { ComponentType, SVGProps } from 'react'
import { IconAnalytics, IconComments, IconDashboard, IconHelp, IconSettings, IconUsers } from '@/shared/ui'

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

export type NavItem = { to: string; label: string; icon: IconComponent; end?: boolean }

export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Дашборд', icon: IconDashboard, end: true },
  { to: '/comments', label: 'Комментарии', icon: IconComments },
  { to: '/analytics', label: 'Аналитика', icon: IconAnalytics },
  { to: '/audience', label: 'Аудитория', icon: IconUsers },
  { to: '/settings', label: 'Настройки', icon: IconSettings },
]

export const HELP_NAV: NavItem = { to: '/help', label: 'Помощь', icon: IconHelp }

export function pageTitle(pathname: string): string {
  const item = [...MAIN_NAV, HELP_NAV].find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
  return item?.label ?? 'ITD Studio'
}
