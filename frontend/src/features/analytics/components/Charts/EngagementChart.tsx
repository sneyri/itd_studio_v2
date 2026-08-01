import type { ReactElement } from 'react'
import type { AnalyticsOverview } from '@/api/types'
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts'
import { COLORS, formatNumber } from '../../utils'

interface EngagementChartProps {
    overview: AnalyticsOverview
}

export function EngagementChart({ overview }: EngagementChartProps): ReactElement {
    const data = [
        { name: 'Лайки', value: overview.total_likes },
        { name: 'Комментарии', value: overview.total_comments },
        { name: 'Репосты', value: overview.total_reposts },
    ].filter((item) => item.value > 0)

    return data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                    {data.map((_, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => formatNumber(Number(value ?? 0))} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </PieChart>
        </ResponsiveContainer>
    ) : (
        <div className="analytics-empty-state">Нет данных</div>
    )
}
