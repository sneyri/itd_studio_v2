import { useState, type ReactElement } from 'react'
import { useAnalytics } from '@/features/analytics/hooks/useAnalytics'
import { OverviewSection } from '@/features/analytics/components/OverviewSection'
import { GrowthSection } from '@/features/analytics/components/GrowthSection'
import type { ChartType } from '@/features/analytics/types'
import './Analytics.css'

interface AnalyticsProps {
    username: string
}

export function Analytics({ username }: AnalyticsProps): ReactElement {
    const [activeTab, setActiveTab] = useState<'overview' | 'growth'>('overview')
    const [selectedChart, setSelectedChart] = useState<ChartType>('likes')
    const { overview, growthData, loading } = useAnalytics(username)

    if (loading) {
        return (
            <div className="analytics-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка аналитики...</p>
            </div>
        )
    }

    if (!overview) {
        return (
            <div className="analytics-error">
                <h3>Не удалось загрузить аналитику</h3>
                <p>Попробуйте обновить страницу или синхронизировать данные</p>
            </div>
        )
    }

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <div className="analytics-title">
                    <h1>Аналитика аккаунта</h1>
                    <h2>За последние 500 постов</h2>
                    <p className="analytics-subtitle">
                        @{overview.username} · {overview.display_name}
                    </p>
                </div>
                <div className="analytics-tabs">
                    <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        Обзор
                    </button>
                    <button className={`tab-btn ${activeTab === 'growth' ? 'active' : ''}`} onClick={() => setActiveTab('growth')}>
                        Рост
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && <OverviewSection overview={overview} growthData={growthData} />}
            {activeTab === 'growth' && (
                <GrowthSection selectedChart={selectedChart} onSelectChart={setSelectedChart} growthData={growthData} />
            )}
        </div>
    )
}

export default Analytics