/** Пункты навигации (сайдбар, нижний таб-бар) и заголовки страниц. */
import type { ComponentType, SVGProps } from 'react'
import { IconAnalytics, IconBell, IconComments, IconDashboard, IconHelp, IconSettings, IconUsers } from '@/shared/ui'

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

/** shortLabel — подпись в нижнем таб-баре, где мало места */
export type NavItem = { to: string; label: string; shortLabel?: string; icon: IconComponent; end?: boolean }

export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Дашборд', icon: IconDashboard, end: true },
  { to: '/notifications', label: 'Уведомления', shortLabel: 'Уведомл.', icon: IconBell },
  { to: '/comments', label: 'Комментарии', shortLabel: 'Коммент.', icon: IconComments },
  { to: '/analytics', label: 'Аналитика', icon: IconAnalytics },
  { to: '/audience', label: 'Аудитория', icon: IconUsers },
  { to: '/settings', label: 'Настройки', icon: IconSettings },
]

/** Нижний таб-бар: 4 главных раздела, остальные — в меню «Ещё» */
export const TABBAR_PRIMARY = ['/', '/notifications', '/comments', '/analytics']

export const HELP_NAV: NavItem = { to: '/help', label: 'Помощь', icon: IconHelp }

export function pageTitle(pathname: string): string {
  const item = [...MAIN_NAV, HELP_NAV].find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))
  return item?.label ?? 'ITD Studio'
}
