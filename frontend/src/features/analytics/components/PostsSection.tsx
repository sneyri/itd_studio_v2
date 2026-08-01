import type { ReactElement } from 'react'
import type { AnalyticsOverview } from '@/api/types'
import { formatNumber } from '../utils'

interface PostsSectionProps {
    overview: AnalyticsOverview
}

export function PostsSection({ overview }: PostsSectionProps): ReactElement {
    const redirectToTopPost = () => {
        if (overview.top_post?.id) {
            window.open(`https://xn--d1ah4a.com/@${overview.username}}/post/${overview.top_post.id}`, "_blank")
        }
    }

    return (
        <section className="analytics-section">
            <div className="analytics-section-header">
                <div>
                    <p className="analytics-section-kicker">Посты</p>
                    <h3>Статистика публикаций</h3>
                </div>
            </div>
            <div className="analytics-section-grid three-column">
                <div className="analytics-panel">
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Всего постов</span>
                        <span className="analytics-metric-value">{formatNumber(overview.posts_count)}</span>
                    </div>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Средние лайки</span>
                        <span className="analytics-metric-value">{overview.avg_likes_per_post.toFixed(1)}</span>
                    </div>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Средние комментарии</span>
                        <span className="analytics-metric-value">{overview.avg_comments_per_post.toFixed(1)}</span>
                    </div>
                </div>
                <div className="analytics-panel"
                onClick={redirectToTopPost}
                style={{cursor: "pointer"}}>
                    <h4 className="analytics-panel-title">Лучший пост</h4>
                    {overview.top_post ? (
                        <>
                            <p className="analytics-panel-text">
                                {overview.top_post.content?.trim() || "У публикации отсутствует текст"}
                            </p>
                            <div className="analytics-tags">
                                <span>❤ {formatNumber(overview.top_post.likes_count)}</span>
                                <span>💬 {formatNumber(overview.top_post.comments_count)}</span>
                                <span>👁 {formatNumber(overview.top_post.views_count)}</span>
                            </div>
                        </>
                    ) : (
                        <p className="analytics-panel-text">Пока нет доступных публикаций</p>
                    )}
                </div>
                <div className="analytics-panel">
                    <h4 className="analytics-panel-title">Недавняя активность</h4>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Просмотры</span>
                        <span className="analytics-metric-value">{formatNumber(overview.total_views)}</span>
                    </div>
                    <div className="analytics-metric-row">
                        <span className="analytics-metric-label">Репосты</span>
                        <span className="analytics-metric-value">{formatNumber(overview.total_reposts)}</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
