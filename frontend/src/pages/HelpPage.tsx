/** Помощь: частые ошибки, советы по безопасности, контакт поддержки. */
import { useState } from 'react'
import { Button, Card } from '@/shared/ui'

const SUPPORT_HANDLE = '@SneyrIII'

const ISSUES = [
  {
    title: 'Сессия истекла / Session revoked',
    description: 'refresh_token истёк или был отозван — обычно это значит, что аккаунт итд разлогинило.',
    solution: 'Войдите в итд заново, возьмите свежий refresh_token и выполните вход в ITD Studio ещё раз.',
  },
  {
    title: '«Синхронизация будет доступна через N мин»',
    description: 'Сервер ограничивает частоту синхронизаций: слишком частые запросы к итд приводят к вылету из аккаунта.',
    solution: 'Подождите указанное время. Данные между синхронизациями не теряются.',
  },
  {
    title: 'График подписчиков короткий или пустой',
    description: 'итд не хранит историю числа подписчиков. Мы восстанавливаем её по уведомлениям и записываем снимки при каждой синхронизации.',
    solution: 'Синхронизируйтесь время от времени — история будет накапливаться.',
  },
]

const TIPS = [
  { title: 'Храните токен в секрете', text: 'refresh_token даёт доступ к аккаунту итд. Не передавайте его третьим лицам.' },
  { title: 'Не злоупотребляйте синхронизацией', text: 'Раз в несколько часов достаточно: так история копится, а аккаунт не вылетает.' },
]

export default function HelpPage() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_HANDLE)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="page page--narrow">
      <Card className="settings-section">
        <h2 className="chart-card__title">Частые ошибки</h2>
        <ul className="help-list">
          {ISSUES.map((issue) => (
            <li key={issue.title} className="help-list__item">
              <p className="help-list__title">{issue.title}</p>
              <p className="help-list__text">{issue.description}</p>
              <p className="help-list__solution">
                <strong>Решение:</strong> {issue.solution}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="settings-section">
        <h2 className="chart-card__title">Советы</h2>
        <ul className="help-list">
          {TIPS.map((tip) => (
            <li key={tip.title} className="help-list__item">
              <p className="help-list__title">{tip.title}</p>
              <p className="help-list__text">{tip.text}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="settings-section">
        <h2 className="chart-card__title">Поддержка</h2>
        <p className="settings-section__note">Не нашли решение? Напишите в итд:</p>
        <div className="support-row">
          <span className="support-row__handle">{SUPPORT_HANDLE}</span>
          <Button size="sm" onClick={() => void copy()}>
            {copied ? 'Скопировано' : 'Скопировать'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
