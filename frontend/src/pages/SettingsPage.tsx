/** Настройки: аккаунт и выход, часовой пояс аналитики, тема оформления. */
import { Link } from 'react-router'
import { useLogout, useSession } from '@/features/auth/hooks'
import { ThemeSwitcher } from '@/features/settings/ThemeSwitcher'
import { TimezoneForm } from '@/features/settings/TimezoneForm'
import { formatDate, formatDateTime, formatNumber } from '@/shared/lib/format'
import { Avatar, Button, Card, IconHelp, IconLogout } from '@/shared/ui'

export default function SettingsPage() {
  const { profile } = useSession()
  const logout = useLogout()
  if (!profile) return null
  const name = profile.display_name || profile.username

  return (
    <div className="page page--narrow">
      <Card className="settings-section">
        <h2 className="chart-card__title">Аккаунт</h2>
        <div className="account">
          <Avatar avatar={profile.avatar} name={name} size={56} />
          <div className="account__text">
            <span className="account__name">{name}</span>
            <span className="account__handle">@{profile.username}</span>
            {profile.bio && <p className="account__bio">{profile.bio}</p>}
          </div>
        </div>
        <dl className="facts">
          <div>
            <dt>Подписчики</dt>
            <dd>{formatNumber(profile.followers_count)}</dd>
          </div>
          <div>
            <dt>Подписки</dt>
            <dd>{formatNumber(profile.following_count)}</dd>
          </div>
          <div>
            <dt>Постов в итд</dt>
            <dd>{formatNumber(profile.posts_count)}</dd>
          </div>
          <div>
            <dt>В итд с</dt>
            <dd>{profile.registered_at ? formatDate(profile.registered_at, profile.timezone) : '—'}</dd>
          </div>
          <div>
            <dt>Последняя синхронизация</dt>
            <dd>{profile.last_synced_at ? formatDateTime(profile.last_synced_at, profile.timezone) : 'ещё не было'}</dd>
          </div>
        </dl>
        <div className="settings-section__actions">
          <Button variant="danger" icon={<IconLogout size={18} />} loading={logout.isPending} onClick={() => logout.mutate()}>
            Выйти
          </Button>
          <p className="settings-section__note">
            При выходе сервер удаляет сохранённый refresh_token. Собранная аналитика остаётся.
          </p>
        </div>
      </Card>

      <Card className="settings-section">
        <h2 className="chart-card__title">Часовой пояс</h2>
        <TimezoneForm />
      </Card>

      <Card className="settings-section">
        <h2 className="chart-card__title">Оформление</h2>
        <ThemeSwitcher />
        <p className="settings-section__note">Тема хранится только в этом браузере.</p>
      </Card>

      <Card className="settings-section">
        <h2 className="chart-card__title">Помощь</h2>
        <p className="settings-section__note">Частые ошибки, безопасность токена и контакт поддержки.</p>
        <Link to="/help" className="btn btn--secondary btn--md settings-section__link">
          <IconHelp size={18} />
          <span className="btn__label">Открыть помощь</span>
        </Link>
      </Card>
    </div>
  )
}
