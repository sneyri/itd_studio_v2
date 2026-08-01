import { type ReactElement } from 'react'
import { useAnalytics } from './hooks/useAnalytics'
import { OverviewPage } from './overview/OverviewPage'
import './../../components/Analytics/Analytics.css'

interface AnalyticsProps {
    username: string
}

export function Analytics({ username }: AnalyticsProps): ReactElement {
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
                    <p className="analytics-subtitle">
                        @{overview.username} · {overview.display_name}
                    </p>
                </div>
            </div>

            <OverviewPage overview={overview} growthData={growthData} />
        </div>
    )
}

export default Analytics
