/** Плейсхолдер загрузки с мерцанием. */
import type { CSSProperties } from 'react'

type SkeletonProps = {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  radius?: CSSProperties['borderRadius']
  className?: string
}

export function Skeleton({ width = '100%', height = 14, radius = 'var(--radius-sm)', className }: SkeletonProps) {
  return <span className={`skeleton ${className ?? ''}`} style={{ width, height, borderRadius: radius }} aria-hidden="true" />
}

export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-lines" role="status" aria-label="Загрузка">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}
