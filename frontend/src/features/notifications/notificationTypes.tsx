/** Человекочитаемые названия и иконки типов уведомлений. Неизвестный тип показываем как есть. */
import type { ReactNode } from 'react'
import { IconAt, IconBell, IconCheck, IconComments, IconHeart, IconMessage, IconRepost, IconUserPlus } from '@/shared/ui'

type TypeMeta = { label: string; action: string; icon: ReactNode; tone: 'like' | 'comment' | 'follow' | 'repost' | 'mention' | 'other' }

const META: Record<string, TypeMeta> = {
  like: { label: 'Лайки', action: 'оценил(а) ваш пост', icon: <IconHeart size={16} />, tone: 'like' },
  comment: { label: 'Комментарии', action: 'прокомментировал(а) ваш пост', icon: <IconMessage size={16} />, tone: 'comment' },
  reply: { label: 'Ответы', action: 'ответил(а) на ваш комментарий', icon: <IconComments size={16} />, tone: 'comment' },
  repost: { label: 'Репосты', action: 'сделал(а) репост', icon: <IconRepost size={16} />, tone: 'repost' },
  follow: { label: 'Подписки', action: 'подписался(ась) на вас', icon: <IconUserPlus size={16} />, tone: 'follow' },
  follow_request: { label: 'Заявки', action: 'хочет подписаться на вас', icon: <IconUserPlus size={16} />, tone: 'follow' },
  follow_accepted: { label: 'Принятые заявки', action: 'принял(а) вашу заявку', icon: <IconCheck size={16} />, tone: 'follow' },
  comment_reaction: { label: 'Реакции на комментарии', action: 'оценил(а) ваш комментарий', icon: <IconHeart size={16} />, tone: 'like' },
  comment_mention: { label: 'Упоминания в комментариях', action: 'упомянул(а) вас в комментарии', icon: <IconAt size={16} />, tone: 'mention' },
  mention: { label: 'Упоминания', action: 'упомянул(а) вас', icon: <IconAt size={16} />, tone: 'mention' },
  wall_post: { label: 'Записи на стене', action: 'оставил(а) запись на вашей стене', icon: <IconMessage size={16} />, tone: 'other' },
}

export const KNOWN_NOTIFICATION_TYPES = Object.keys(META)

export function notificationMeta(type: string): TypeMeta {
  return META[type] ?? { label: type, action: `уведомление «${type}»`, icon: <IconBell size={16} />, tone: 'other' }
}
