import type { ReactElement } from 'react'
import type { GrowthData } from '@/api/types'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatNumber, formatTooltipDate } from '../../utils'

interface GrowthChartProps {
    data: GrowthData[]
    title: string
    color: string
}

export function GrowthChart({ data, title, color }: GrowthChartProps): ReactElement {
    return (
        <>
            <div className="analytics-chart-header">
                <h4>{title}</h4>
                <span>{data.length > 0 ? formatNumber(data[data.length - 1]?.count ?? 0) : '0'}</span>
            </div>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="date" tickFormatter={formatDate} stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value: number) => formatNumber(value)} />
                        <Tooltip
                            labelFormatter={(label: unknown) => formatTooltipDate(String(label ?? ''))}
                            formatter={(value: unknown, name: unknown) => {
                                const numericValue = Number(value ?? 0)
                                const labelText = String(name ?? '')
                                if (labelText === 'count') return [`${formatNumber(numericValue)}`, 'Всего']
                                if (labelText === 'daily') return [`${formatNumber(numericValue)}`, 'За день']
                                return [numericValue, labelText]
                            }}
                            contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={color}
                            strokeWidth={2}
                            fill="#ffcc0076"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="analytics-empty-state">Нет данных для отображения</div>
            )}
        </>
    )
}
