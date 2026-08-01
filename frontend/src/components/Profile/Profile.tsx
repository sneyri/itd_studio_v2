import "./Profile.css"

interface ProfileProps {
    user: {
        username: string
        displayName?: string
        followers_count: number
        following_count?: number
        posts_count?: number
        avatar?: string
        bio?: string
    }
    onLogout: () => void
}

function Profile({ user, onLogout }: ProfileProps) {
    return (
        <div className="profile-container">
            <h2>Привет, {user.displayName || user.username}</h2>
            <p>Подписчиков: {user.followers_count}</p>
            <button onClick={onLogout}>Выйти</button>
        </div>
    )
}

export default Profile