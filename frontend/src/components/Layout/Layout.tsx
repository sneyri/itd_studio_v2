import { ReactNode } from 'react'
import { ThemeToggle } from '../ThemeToggle'

import "./Layout.css"

interface LayoutProps {
    children: ReactNode
    onLogout: () => void
}

export function Layout({ children, onLogout }: LayoutProps) {
    return (
        <div className="app-layout">
            <header className="topbar glass-panel">
                <div className="topbar-left">
                    <h1>ИТД Studio</h1>
                </div>
                <div className="topbar-right">
                    <ThemeToggle />
                    <button className="btn-secondary" onClick={onLogout}>
                        Выйти
                    </button>
                </div>
            </header>
            
            <main className="main-content">
                {children}
            </main>
        </div>
    )
}