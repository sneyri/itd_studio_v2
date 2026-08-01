import { useState } from 'react'
import { connectUser } from '@/api/auth'
import type { User } from '@/api/types'

import './Auth.css'

interface AuthProps {
    onAuthSuccess: (data: User) => void
}

function Auth({ onAuthSuccess }: AuthProps) {
    const [token, setToken] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleConnect = async () => {
        if (!token.trim()) {
            setError('Введите refresh_token')
            return
        }

        setLoading(true)
        setError('')

        try {
            const userData = await connectUser(token.trim())
            onAuthSuccess(userData)
            setToken('')
        } catch (err) {
            const error = err as Error
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth__container">
            <input
                className="auth__input"
                type="text"
                placeholder="Введите refresh_token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
            />
            <button
                className="auth__button"
                onClick={handleConnect}
                disabled={loading}
            >
                {loading ? 'Авторизация...' : 'Обновить данные'}
            </button>
            <div className="error">ВАЖНО! Не злоупотребляйте функцией обновления данных. Из за частого использования у вас может вылетать с аккаунта.</div>
            {error && <div className="error">{error}</div>}
        </div>
    )
}

export default Auth