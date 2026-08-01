import { API_URL } from './client'
import type { User } from './types'

export async function connectUser(refreshToken: string): Promise<User> {
    const response = await fetch(`${API_URL}/sync/${refreshToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json()

    if (!response.ok || data.status !== 'success') {
        throw new Error(data.detail || 'Ошибка синхронизации')
    }

    return data.data.user
}
