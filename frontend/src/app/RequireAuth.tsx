/** Пропускает только с активной сессией; иначе — на /login. Внутри сессии доступен SyncProvider. */
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from '@/features/auth/hooks'
import { SyncProvider } from '@/features/sync/SyncProvider'
import { Card, ErrorState } from '@/shared/ui'
import { PageFallback } from './PageFallback'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { profile, isLoading, error, refetch } = useSession()
  const location = useLocation()

  if (isLoading) return <PageFallback fullscreen />

  if (error) {
    return (
      <div className="page-fallback page-fallback--fullscreen">
        <Card className="auth-error-card">
          <ErrorState error={error} onRetry={() => void refetch()} title="Не удалось проверить сессию" />
        </Card>
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <SyncProvider>{children}</SyncProvider>
}
