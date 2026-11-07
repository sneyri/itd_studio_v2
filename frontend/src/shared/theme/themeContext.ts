/** Контекст темы. Провайдер — ThemeProvider.tsx, чтение — useTheme.ts. */
import { createContext } from 'react'
import type { ThemeName } from './theme'

export type ThemeContextValue = {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
