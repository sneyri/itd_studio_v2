import { Layout } from './components/Layout/Layout'
import Auth from './components/Auth/Auth'
import { ProfileHeader } from './components/ProfileHeader/ProfileHeader'
import { Dashboard } from './components/Dashboard/Dashboard'
import { useAuthSession } from './hooks/useAuthSession'

import './App.css'

function App() {
    const { isAuthenticated, user, handleAuthSuccess, handleLogout } = useAuthSession()

    if (isAuthenticated === null) {
        return <div className="text-center mt-3">Загрузка...</div>
    }

    return (
        <Layout onLogout={handleLogout}>
            <Dashboard username={user?.username}>
                <div className="profile-section">
                    {user ? (
                        <ProfileHeader user={user} />
                    ) : (
                        <div className="profile-placeholder glass-panel">
                            <div className="placeholder-content">
                                <span className="placeholder-icon">⌨️</span>
                                <h3>Войдите в аккаунт</h3>
                                <p>Введите refresh_token в поле ниже, а после нажмите: "Обновить данные"</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="auth-section">
                    <Auth onAuthSuccess={handleAuthSuccess} />
                </div>
            </Dashboard>
        </Layout>
    )
}

export default App