/** Страница входа по refresh_token. */
import { Navigate } from 'react-router'
import logo from '@/assets/logo.jpg'
import { useSession } from '@/features/auth/hooks'
import { LoginForm } from '@/features/auth/LoginForm'
import { ThemeSwitcher } from '@/features/settings/ThemeSwitcher'
import { Card, IconKey } from '@/shared/ui'

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useSession()
  if (!isLoading && isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="login-page">
      <title>Вход · ITD Studio</title>
      <div className="login-page__theme">
        <ThemeSwitcher size="sm" />
      </div>
      <Card className="login-card">
        <div className="login-card__brand">
          <img src={logo} alt="" width={44} height={44} className="logo__mark" />
          <span className="logo__text">
            ITD <span className="logo__divider">|</span> <span className="logo__studio">studio</span>
          </span>
        </div>
        <h1 className="login-card__title">Вход</h1>
        <p className="login-card__subtitle">Аналитика вашего аккаунта в итд: подписчики, просмотры, лучшее время для постов.</p>
        <LoginForm />
        <details className="login-card__howto">
          <summary>
            <IconKey size={16} /> Где взять refresh_token?
          </summary>
          <ol>
            <li>Откройте итд в браузере и войдите в аккаунт.</li>
            <li>Откройте инструменты разработчика (F12) → Application/Хранилище → Cookies.</li>
            <li>Скопируйте значение cookie <code>refresh_token</code> и вставьте его сюда.</li>
          </ol>
        </details>
      </Card>
    </div>
  )
}
