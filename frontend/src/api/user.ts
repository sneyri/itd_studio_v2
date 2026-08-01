import { API_URL } from './client'
import type { User } from './types'

export async function getUser(username: string): Promise<User> {
    const response = await fetch(`${API_URL}/user/${username}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Ошибка получения пользователя')
    return data.data
}

export async function getUserPosts(username: string, limit: number = 50, offset: number = 0) {
    const response = await fetch(`${API_URL}/user/${username}/posts?limit=${limit}&offset=${offset}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Ошибка получения постов')
    return data.data
}

export async function getPost(postId: string) {
    const response = await fetch(`${API_URL}/post/${postId}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || 'Ошибка получения поста')
    return data.data
}
