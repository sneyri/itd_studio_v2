/** Точка входа: глобальные стили (токены → темы → база → компоненты) и монтирование приложения. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/theme/tokens.css'
import './shared/theme/themes.css'
import './shared/theme/base.css'
import './shared/ui/ui.css'
import './shared/ui/controls.css'
import './app/layout/layout.css'
import './features/features.css'
import './pages/pages.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
