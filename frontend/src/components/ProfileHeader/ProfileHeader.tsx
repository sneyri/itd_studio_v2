import type { User } from '@/api/types'

import './ProfileHeader.css'

interface ProfileHeaderProps {
    user: User
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <div className="profile-header glass-panel">
            <div className="profile-avatar">
                <span>{user.avatar}</span>
            </div>

            <div className="profile-info">
                <h2 className="profile-name">{user.displayName || user.username}</h2>
                <p className="profile-username">@{user.username}</p>
                {user.bio && <p className="profile-bio">{user.bio}</p>}

                <div className="profile-stats">
                    <div className="stat-item">
                        <span className="stat-value">{user.followers_count}</span>
                        <span className="stat-label">Подписчики</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{user.following_count}</span>
                        <span className="stat-label">Подписки</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{user.posts_count}</span>
                        <span className="stat-label">Посты</span>
                    </div>
                </div>
            </div>
        </div>
    )
}