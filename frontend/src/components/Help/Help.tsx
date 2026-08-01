import { useState } from 'react'
import './Help.css'

function Help() {
    const [copied, setCopied] = useState(false)

    const commonIssues = [
        {
            id: 'session_revoked',
            title: 'Session revoked',
            description: 'Токен истек или был отозван. Требуется повторная авторизация.',
            solution: 'Скорее всего у вас вылетел аккаунт ИТД. Войдите в аккаунт и вставьте новый токен'
        },
    ]

    const handleCopyUsername = () => {
        navigator.clipboard.writeText('@SneyrIII')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="help-container">
            <div className="help-header">
                <h1>Поддержка</h1>
                <p className="help-subtitle">Решение частых проблем и поддержка</p>
            </div>

            <div className="help-content">
                <div className="help-section">
                    <h2>Частые ошибки</h2>
                    <div className="issues-grid">
                        {commonIssues.map((issue) => (
                            <div key={issue.id} className="issue-card">
                                <div className="issue-title">{issue.title}</div>
                                <div className="issue-description">{issue.description}</div>
                                <div className="issue-solution">
                                    <strong>Решение:</strong> {issue.solution}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="help-section support-section">
                    <h2>Контакт поддержки</h2>
                    <div className="support-card">
                        <div className="support-info">
                            <div className="support-text">
                                <div className="support-label">Техническая поддержка</div>
                                <div className="support-username" onClick={handleCopyUsername}>
                                    @SneyrIII
                                    <span className="copy-hint">
                                        {copied ? 'Скопировано!' : 'Нажмите чтобы скопировать'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="support-message">
                            <p>Если вы не нашли решение в списке выше или у вас возникла другая проблема, напишите в поддержку.</p>
                            <p className="support-response-time">Мы постараемся ответить как можно быстрее!</p>
                        </div>
                    </div>
                </div>

                <div className="help-section tips-section">
                    <h2>Советы</h2>
                    <div className="tips-grid">
                        <div className="tip-card">
                            <h4>Храните токен в безопасности</h4>
                            <p>Refresh_token дает доступ к вашему аккаунту. Не передавайте его третьим лицам.</p>
                        </div>
                        <div className="tip-card">
                            <h4>Не злоупотребляйте обновлением данных</h4>
                            <p>Пожалуйста...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Help