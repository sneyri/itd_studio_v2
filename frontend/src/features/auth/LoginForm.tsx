/** Форма входа по refresh_token итд. Токен уходит только в теле POST /api/auth/login. */
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/shared/api/client'
import { Button, Input } from '@/shared/ui'
import { useLogin } from './hooks'

function loginErrorText(error: unknown): string | null {
  if (!error) return null
  if (error instanceof ApiError) {
    if (error.code === 'invalid_token') return 'Токен недействителен или истёк. Возьмите свежий refresh_token.'
    if (error.code === 'itd_unavailable') return 'итд сейчас не отвечает. Попробуйте через пару минут.'
    if (error.code === 'validation_error') return 'Вставьте токен целиком.'
    return error.message
  }
  return 'Не удалось войти'
}

export function LoginForm() {
  const [token, setToken] = useState('')
  const [visible, setVisible] = useState(false)
  const loginMutation = useLogin()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = token.trim()
    if (!value) return
    loginMutation.mutate(value)
  }

  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <Input
        label="refresh_token"
        name="refresh_token"
        type={visible ? 'text' : 'password'}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Вставьте токен из итд"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        error={loginErrorText(loginMutation.error)}
        hint="Токен хранится на сервере в зашифрованном виде и не попадает в адресную строку."
        trailing={
          <button
            type="button"
            className="login-form__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Скрыть токен' : 'Показать токен'}
          >
            {visible ? 'Скрыть' : 'Показать'}
          </button>
        }
      />
      <Button type="submit" variant="primary" size="lg" block loading={loginMutation.isPending} disabled={!token.trim()}>
        Войти и синхронизировать
      </Button>
    </form>
  )
}
