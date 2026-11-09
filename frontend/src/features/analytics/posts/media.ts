/** Утилиты для вложений постов. */
import { plural } from '@/shared/lib/format'
import type { Attachment } from '../types'

/** Короткая подпись о составе медиа: «3 фото», «видео», «2 фото · видео». */
export function mediaSummary(attachments: Attachment[]): string | null {
  const images = attachments.filter((a) => a.kind === 'image').length
  const videos = attachments.filter((a) => a.kind === 'video').length
  const other = attachments.length - images - videos
  const parts: string[] = []
  if (images) parts.push(images === 1 ? 'фото' : `${images} фото`)
  if (videos) parts.push(videos === 1 ? 'видео' : `${videos} видео`)
  if (other) parts.push(`${other} ${plural(other, ['файл', 'файла', 'файлов'])}`)
  return parts.length ? parts.join(' · ') : null
}
