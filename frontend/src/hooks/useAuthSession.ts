import { useEffect, useState } from 'react'
import type { User } from '@/api/types'

export function useAuthSession() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const savedUser = localStorage.getItem('itd_user')
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser) as User
                setUser(parsed)
                setIsAuthenticated(true)
            } catch {
                localStorage.removeItem('itd_user')
                setIsAuthenticated(false)
            }
        } else {
            setIsAuthenticated(false)
        }
    }, [])

    const handleAuthSuccess = (userData: User) => {
        localStorage.setItem('itd_user', JSON.stringify(userData))
        setUser(userData)
        setIsAuthenticated(true)
    }

    const handleLogout = () => {
        localStorage.removeItem('itd_user')
        setUser(null)
        setIsAuthenticated(false)
    }

    return {
        isAuthenticated,
        user,
        handleAuthSuccess,
        handleLogout,
    }
}
