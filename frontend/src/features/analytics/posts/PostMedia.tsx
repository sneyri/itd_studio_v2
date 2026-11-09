/**
 * Медиа поста: сетка картинок (1 / 2 / 3 / 4+ как в соцсетях) с лайтбоксом, видео со стандартным
 * плеером, аудио и ссылки на прочие файлы. Плюс миниатюра 48px для списков.
 * Битая ссылка → плейсхолдер «Медиа недоступно» (CDN итд может удалить файл).
 */
import { useState } from 'react'
import { IconFile, IconImage, IconPlay, Lightbox } from '@/shared/ui'
import type { Attachment } from '../types'
import { mediaSummary } from './media'

const MAX_GRID = 4

function Unavailable({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`media-unavailable ${compact ? 'media-unavailable--compact' : ''}`} role="img" aria-label="Медиа недоступно">
      <IconImage size={compact ? 18 : 22} />
      {!compact && <span>Медиа недоступно</span>}
    </span>
  )
}

function GridImage({ attachment, onOpen, overlay }: { attachment: Attachment; onOpen: () => void; overlay?: number }) {
  const [broken, setBroken] = useState(false)
  if (broken) return <Unavailable />
  return (
    <button type="button" className="media-grid__item" onClick={onOpen} aria-label="Открыть изображение">
      <img src={attachment.url} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
      {overlay ? <span className="media-grid__more">+{overlay}</span> : null}
    </button>
  )
}

function VideoPlayer({ attachment }: { attachment: Attachment }) {
  const [broken, setBroken] = useState(false)
  if (broken) return <Unavailable />
  const ratio = attachment.width && attachment.height ? `${attachment.width} / ${attachment.height}` : undefined
  return (
    <video
      className="media-video"
      src={attachment.url}
      controls
      preload="metadata"
      playsInline
      style={ratio ? { aspectRatio: ratio } : undefined}
      onError={() => setBroken(true)}
    >
      Ваш браузер не воспроизводит это видео. <a href={attachment.url}>Скачать</a>
    </video>
  )
}

function fileName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'файл')
  } catch {
    return 'файл'
  }
}

export function PostMedia({ attachments }: { attachments: Attachment[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const images = attachments.filter((a) => a.kind === 'image')
  const videos = attachments.filter((a) => a.kind === 'video')
  const audios = attachments.filter((a) => a.kind === 'audio')
  const files = attachments.filter((a) => a.kind === 'file')
  if (attachments.length === 0) return null

  const shown = images.slice(0, MAX_GRID)
  const rest = images.length - shown.length

  return (
    <div className="post-media">
      {shown.length > 0 && (
        <div className={`media-grid media-grid--${shown.length}`}>
          {shown.map((image, index) => (
            <GridImage
              key={image.id || image.url}
              attachment={image}
              onOpen={() => setOpen(index)}
              overlay={index === shown.length - 1 && rest > 0 ? rest : undefined}
            />
          ))}
        </div>
      )}
      {videos.map((video) => (
        <VideoPlayer key={video.id || video.url} attachment={video} />
      ))}
      {audios.map((audio) => (
        <audio key={audio.id || audio.url} className="media-audio" src={audio.url} controls preload="none" />
      ))}
      {files.map((file) => (
        <a key={file.id || file.url} className="media-file" href={file.url} target="_blank" rel="noopener noreferrer">
          <IconFile size={18} /> {fileName(file.url)}
        </a>
      ))}
      {open !== null && (
        <Lightbox images={images.map((i) => ({ url: i.url }))} index={open} onIndexChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  )
}

/** Миниатюра первого вложения для списков (48px по умолчанию). */
export function PostMediaThumb({ attachments, size = 48 }: { attachments: Attachment[]; size?: number }) {
  const [broken, setBroken] = useState(false)
  const first = attachments.find((a) => a.kind === 'image') ?? attachments.find((a) => a.kind === 'video') ?? attachments[0]
  if (!first) return null
  const style = { width: size, height: size }
  const label = mediaSummary(attachments) ?? 'медиа'

  let content
  if (broken) content = <Unavailable compact />
  else if (first.kind === 'image')
    content = <img src={first.url} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
  else if (first.kind === 'video')
    content = (
      <>
        <video src={`${first.url}#t=0.1`} preload="metadata" muted playsInline onError={() => setBroken(true)} tabIndex={-1} />
        <span className="media-thumb__play">
          <IconPlay size={14} />
        </span>
      </>
    )
  else content = <IconFile size={20} />

  return (
    <span className="media-thumb" style={style} title={label} aria-label={label} role="img">
      {content}
      {attachments.length > 1 && <span className="media-thumb__count">{attachments.length}</span>}
    </span>
  )
}
