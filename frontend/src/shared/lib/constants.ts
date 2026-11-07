/** Общие константы интерфейса. */

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const
export const WEEKDAYS_LONG = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'] as const

/** Интервал опроса статуса синхронизации, мс */
export const SYNC_POLL_INTERVAL = 2000

/** Размер страницы таблицы постов */
export const POSTS_PAGE_SIZE = 20

/** Запасной список часовых поясов, если браузер не поддерживает Intl.supportedValuesOf */
export const FALLBACK_TIMEZONES = [
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Novosibirsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'Europe/Minsk',
  'Europe/Kyiv',
  'Asia/Almaty',
  'Asia/Tashkent',
  'Asia/Tbilisi',
  'Asia/Yerevan',
  'Europe/Berlin',
  'Europe/London',
  'UTC',
]

export function listTimezones(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
    const values = intl.supportedValuesOf?.('timeZone')
    if (values && values.length > 0) return values.includes('UTC') ? values : [...values, 'UTC']
  } catch {
    // старый браузер — используем запасной список
  }
  return FALLBACK_TIMEZONES
}
