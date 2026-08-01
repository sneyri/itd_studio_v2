import { useEffect, useState } from 'react'
import type { ThemeName } from './index'

export function useTheme() {
    const [theme, setTheme] = useState<ThemeName>(() => {
        const saved = localStorage.getItem('itd_theme') as ThemeName | null
        return saved || 'dark'
    })

    useEffect(() => {
        document.body.classList.remove('light-theme', 'vk2011-theme')

        if (theme === 'light') document.body.classList.add('light-theme')
        if (theme === 'vk') document.body.classList.add('vk2011-theme')

        localStorage.setItem('itd_theme', theme)
    }, [theme])

    return { theme, setTheme }
}
