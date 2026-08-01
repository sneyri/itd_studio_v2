import { ReactNode, useState } from 'react'
import './Dashboard.css'

import { Analytics } from '@/features/analytics'
import Help from '../Help/Help'

interface DashboardProps {
    children: ReactNode
    username?: string
}

type Tab = 'home' | 'analytics' | 'help'

const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'home', label: 'Главная' },
    { id: 'analytics', label: 'Аналитика' },
    { id: 'help', label: 'Частые ошибки' },
]

export function Dashboard({ children, username }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('home')

    return (
        <div className="dashboard">
            <aside className="dashboard-sidebar">
                <nav className="dashboard-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`dashboard-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="dashboard-content">
                {activeTab === 'home' && children}
                {activeTab === 'analytics' && <Analytics username={username || ''} />}
                {activeTab === 'help' && <Help />}
            </main>
        </div>
    )
}