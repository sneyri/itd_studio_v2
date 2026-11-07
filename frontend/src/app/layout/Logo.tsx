/** Логотип «ИТД | studio». */
import { Link } from 'react-router'
import logo from '@/assets/logo.jpg'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={`logo ${compact ? 'logo--compact' : ''}`} aria-label="ITD Studio — на главную">
      <img src={logo} alt="" width={30} height={30} className="logo__mark" />
      {!compact && (
        <span className="logo__text">
          ITD <span className="logo__divider">|</span> <span className="logo__studio">studio</span>
        </span>
      )}
    </Link>
  )
}
