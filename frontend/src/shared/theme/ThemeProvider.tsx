/** Провайдер темы: держит текущую тему, применяет её к <html> и запоминает в localStorage. */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, storeTheme, type ThemeName } from './theme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const initial = readStoredTheme()
    applyTheme(initial)
    return initial
  })

  const setTheme = useCallback((next: ThemeName) => {
    applyTheme(next)
    storeTheme(next)
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
