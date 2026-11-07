/** Верхняя панель: заголовок раздела, переключатель темы, синхронизация. */
import { ThemeSwitcher } from '@/features/settings/ThemeSwitcher'
import { SyncButton } from '@/features/sync/SyncButton'
import { Logo } from './Logo'

export function Topbar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <div className="topbar__title-row">
        <span className="topbar__logo">
          <Logo compact />
        </span>
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__controls">
        <ThemeSwitcher />
        <SyncButton />
      </div>
    </header>
  )
}
