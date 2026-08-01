import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light' | 'vk'

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('itd_theme') as Theme | null
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