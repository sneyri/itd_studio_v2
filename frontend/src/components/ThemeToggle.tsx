import { useTheme } from '../themes/useTheme'
import { themeOptions } from '../themes'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="theme-toggle-group">
            {themeOptions.map((option) => (
                <button
                    key={option.value}
                    className={`theme-btn ${theme === option.value ? 'active' : ''}`}
                    onClick={() => setTheme(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}