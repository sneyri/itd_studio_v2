/** Честный список того, что API итд не отдаёт — чтобы не выдумывать метрики. */
import { Card, IconInfo } from '@/shared/ui'

const MISSING = [
  {
    title: 'Отписки',
    text: 'Событий отписки в API нет. Поэтому восстановленный ряд — оценка снизу: те, кто позже отписался, в прошлом ещё были подписчиками, но ряд их не учитывает.',
  },
  {
    title: 'Дата подписки у списка подписчиков',
    text: 'Список подписчиков приходит без дат. Даты есть только в уведомлениях, а их история ограничена.',
  },
  {
    title: 'Демография и география',
    text: 'Пол, возраст, город и устройства аудитории итд не предоставляет.',
  },
  {
    title: 'Охват и источники просмотров',
    text: 'Доступно только суммарное число просмотров поста, без уникальных зрителей и источников трафика.',
  },
]

export function MissingDataCard() {
  return (
    <Card className="list-card">
      <header className="list-card__header">
        <h2 className="chart-card__title">Чего нет в API итд</h2>
        <p className="chart-card__subtitle">Эти блоки мы не показываем, чтобы не подставлять выдуманные цифры</p>
      </header>
      <ul className="missing-list">
        {MISSING.map((item) => (
          <li key={item.title} className="missing-list__item">
            <span className="missing-list__icon">
              <IconInfo size={18} />
            </span>
            <div>
              <p className="missing-list__title">{item.title}</p>
              <p className="missing-list__text">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
