/** Переключатель темы «Темная / Светлая / VK». */
import { THEMES, useTheme } from '@/shared/theme'
import { Tabs } from '@/shared/ui'

const OPTIONS = THEMES.map((t) => ({ ...t, shortLabel: t.value === 'dark' ? 'Тём.' : t.value === 'light' ? 'Свет.' : 'VK' }))

export function ThemeSwitcher({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { theme, setTheme } = useTheme()
  return <Tabs label="Тема оформления" options={OPTIONS} value={theme} onChange={setTheme} size={size} />
}
