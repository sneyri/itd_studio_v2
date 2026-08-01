import { useEffect, useState } from 'react'
import { getAnalyticsGrowth, getAnalyticsOverview } from '@/api/analytics'
import type { AnalyticsOverview, GrowthData } from '@/api/types'
import type { ChartType } from '../types'

export function useAnalytics(username: string) {
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
    const [growthData, setGrowthData] = useState<Record<ChartType, GrowthData[]>>({
        likes: [],
        comments: [],
        reposts: [],
        followers: [],
        views: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const fetchAnalytics = async () => {
            setLoading(true)

            try {
                const [overviewData, likesData, commentsData, repostsData, followersData, viewsData] = await Promise.all([
                    getAnalyticsOverview(username),
                    getAnalyticsGrowth(username, 'likes'),
                    getAnalyticsGrowth(username, 'comments'),
                    getAnalyticsGrowth(username, 'reposts'),
                    getAnalyticsGrowth(username, 'followers'),
                    getAnalyticsGrowth(username, 'views'),
                ])

                if (!isMounted) return

                setOverview(overviewData)
                setGrowthData({
                    likes: likesData,
                    comments: commentsData,
                    reposts: repostsData,
                    followers: followersData,
                    views: viewsData,
                })
            } catch (error) {
                console.error('Error fetching analytics:', error)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        if (username) {
            void fetchAnalytics()
        } else {
            setLoading(false)
        }

        return () => {
            isMounted = false
        }
    }, [username])

    return {
        overview,
        growthData,
        loading,
    }
}
