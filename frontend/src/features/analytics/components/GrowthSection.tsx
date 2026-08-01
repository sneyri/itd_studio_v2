import type { ReactElement } from 'react'
import type { GrowthData } from '@/api/types'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_CONFIG, formatDate, formatNumber, formatTooltipDate } from '../utils'
import type { ChartType } from '../types'

interface GrowthSectionProps {
    selectedChart: ChartType
    onSelectChart: (chart: ChartType) => void
    growthData: Record<ChartType, GrowthData[]>
}

export function GrowthSection({ selectedChart, onSelectChart, growthData }: GrowthSectionProps): ReactElement {
    return (
        <div className="analytics-growth">
            <div className="growth-tabs">
                <button className={`growth-tab ${selectedChart === 'likes' ? 'active' : ''}`} onClick={() => onSelectChart('likes')}>Лайки</button>
                <button className={`growth-tab ${selectedChart === 'comments' ? 'active' : ''}`} onClick={() => onSelectChart('comments')}>Комментарии</button>
                <button className={`growth-tab ${selectedChart === 'reposts' ? 'active' : ''}`} onClick={() => onSelectChart('reposts')}>Репосты</button>
                <button className={`growth-tab ${selectedChart === 'followers' ? 'active' : ''}`} onClick={() => onSelectChart('followers')}>Подписчики</button>
            </div>

            <div className="growth-chart-card">
                <div className="growth-chart-header">
                    <h3>{CHART_CONFIG[selectedChart].title}</h3>
                    <span className="growth-total">
                        Всего: {formatNumber(growthData[selectedChart].length > 0 ? growthData[selectedChart][growthData[selectedChart].length - 1]?.count || 0 : 0)}
                    </span>
                </div>
                {growthData[selectedChart].length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={growthData[selectedChart]}>
                            <defs>
                                <linearGradient id={`gradient-${selectedChart}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_CONFIG[selectedChart].color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_CONFIG[selectedChart].color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value: string) => formatDate(value)}
                                stroke="#9ca3af"
                                fontSize={12}
                                interval={Math.floor(growthData[selectedChart].length / 10)}
                            />
                            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value: number) => formatNumber(value)} />
                            <Tooltip
                                labelFormatter={(label: unknown) => formatTooltipDate(String(label ?? ''))}
                                formatter={(value: unknown, name: unknown) => {
                                    const numericValue = Number(value ?? 0)
                                    const label = String(name ?? '')
                                    if (label === 'count') return [`${formatNumber(numericValue)}`, 'Всего']
                                    if (label === 'daily') return [`${formatNumber(numericValue)}`, 'За день']
                                    return [numericValue, label]
                                }}
                                contentStyle={{
                                    backgroundColor: '#1f2028',
                                    border: '1px solid #2e303a',
                                    borderRadius: '8px',
                                    color: '#f3f4f6'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke={CHART_CONFIG[selectedChart].color}
                                strokeWidth={2}
                                fill={`url(#gradient-${selectedChart})`}
                                fillOpacity={1}
                            />
                            <Area
                                type="monotone"
                                dataKey="daily"
                                stroke={CHART_CONFIG[selectedChart].color}
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                fill="none"
                                opacity={0.5}
                            />
                            <Legend
                                wrapperStyle={{ color: '#f3f4f6' }}
                                formatter={(value: string) => {
                                    if (value === 'count') return 'Накопленный итог'
                                    if (value === 'daily') return 'За день'
                                    return value
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="no-data">
                        <p>Нет данных для отображения</p>
                    </div>
                )}
            </div>
        </div>
    )
}
