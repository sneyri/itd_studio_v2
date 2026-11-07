/** Каркас приложения: сайдбар (десктоп), топбар, контент, нижний таб-бар (мобильные). */
import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { SyncNotice } from '@/features/sync/SyncNotice'
import { PageFallback } from '../PageFallback'
import { MobileTabbar } from './MobileTabbar'
import { pageTitle } from './navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { pathname } = useLocation()
  const title = pageTitle(pathname)

  return (
    <div className="app-shell">
      <title>{`${title} · ITD Studio`}</title>
      <Sidebar />
      <div className="app-main">
        <Topbar title={title} />
        <main className="app-content" id="main">
          <SyncNotice />
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileTabbar />
    </div>
  )
}
