/** Значок верификации рядом с именем. null/false — ничего не рисуем (статус неизвестен или нет). */
import { IconVerified } from './icons'

export function VerifiedBadge({ verified, size = 15 }: { verified: boolean | null | undefined; size?: number }) {
  if (!verified) return null
  return (
    <span className="verified-badge" title="Верифицированный пользователь" role="img" aria-label="верифицирован">
      <IconVerified size={size} />
    </span>
  )
}
