/** Маршруты: /login — публичный, остальные разделы — за RequireAuth внутри общего каркаса. */
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './layout/AppLayout'
import { RequireAuth } from './RequireAuth'
import { PageFallback } from './PageFallback'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const CommentsPage = lazy(() => import('@/pages/CommentsPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const AudiencePage = lazy(() => import('@/pages/AudiencePage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback fullscreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="comments" element={<CommentsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audience" element={<AudiencePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
