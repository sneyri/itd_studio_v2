/** Заглушка на время загрузки страницы/сессии. */
import logo from '@/assets/logo.jpg'
import { Spinner } from '@/shared/ui'

export function PageFallback({ fullscreen = false }: { fullscreen?: boolean }) {
  if (!fullscreen) {
    return (
      <div className="page-fallback">
        <Spinner size={24} label="Загрузка страницы" />
      </div>
    )
  }
  return (
    <div className="page-fallback page-fallback--fullscreen">
      <img src={logo} alt="" width={48} height={48} className="page-fallback__logo" />
      <Spinner size={22} label="Загрузка" />
    </div>
  )
}
