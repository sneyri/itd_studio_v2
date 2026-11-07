/**
 * Темы интерфейса: список, хранение выбора в localStorage (единственное, что там хранится)
 * и применение к <html data-theme>.
 */
export type ThemeName = 'dark' | 'light' | 'vk'

export const THEMES: ReadonlyArray<{ value: ThemeName; label: string }> = [
  { value: 'dark', label: 'Темная' },
  { value: 'light', label: 'Светлая' },
  { value: 'vk', label: 'VK' },
]

const STORAGE_KEY = 'itd-studio:theme'
const DEFAULT_THEME: ThemeName = 'dark'

function isTheme(value: unknown): value is ThemeName {
  return value === 'dark' || value === 'light' || value === 'vk'
}

export function readStoredTheme(): ThemeName {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isTheme(value) ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function storeTheme(theme: ThemeName): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // приватный режим / заблокированное хранилище — тема просто не запомнится
  }
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme
}
