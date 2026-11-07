/**
 * Аватар пользователя итд. Сервис отдаёт в поле avatar либо URL картинки, либо эмодзи:
 * URL → <img>, эмодзи → текст в круге, пусто → первая буква имени.
 */
import { useState } from 'react'

type AvatarProps = {
  avatar: string | null | undefined
  name: string | null | undefined
  size?: number
}

function isImageUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('data:image/')
}

export function Avatar({ avatar, name, size = 38 }: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const value = avatar?.trim() ?? ''
  const fallback = (name?.trim()?.[0] ?? '?').toUpperCase()
  const style = { width: size, height: size, fontSize: Math.round(size * 0.48) }

  if (value && isImageUrl(value) && !broken) {
    return (
      <span className="avatar" style={style}>
        <img src={value} alt={name ? `Аватар ${name}` : 'Аватар'} onError={() => setBroken(true)} loading="lazy" />
      </span>
    )
  }

  const isEmoji = value && !isImageUrl(value)
  return (
    <span className={`avatar ${isEmoji ? 'avatar--emoji' : 'avatar--letter'}`} style={style} role="img" aria-label={name ? `Аватар ${name}` : 'Аватар'}>
      {isEmoji ? value : fallback}
    </span>
  )
}
