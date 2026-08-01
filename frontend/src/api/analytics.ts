import { API_URL } from './client'
import type { AnalyticsOverview, GrowthData } from './types'

export async function getAnalyticsOverview(username: string): Promise<AnalyticsOverview> {
    const response = await fetch(`${API_URL}/analytics/${username}/overview`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Ошибка получения аналитики')
    return data.data
}

export async function getAnalyticsGrowth(username: string, type: 'likes' | 'comments' | 'reposts' | 'followers' | 'views'): Promise<GrowthData[]> {
    const response = await fetch(`${API_URL}/analytics/${username}/growth/${type}`)
    const data = await response.json()
    
    if (!response.ok) throw new Error(data.detail || 'Ошибка получения данных роста')
    return data.data
}
