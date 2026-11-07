# ITD Studio — frontend

React 19 + Vite + TypeScript. Данные — TanStack Query, маршруты — react-router, графики — Recharts.
Контракт с бэкендом описан в [`../docs/API.md`](../docs/API.md).

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173, /api проксируется на http://127.0.0.1:8000
```

Бэкенд должен быть запущен (см. корневой README). Сборка и проверки:

```bash
npm run build      # tsc -b + vite build → dist/
npm run lint       # oxlint
npm run preview    # раздать dist/ (тоже с прокси /api)
```

## Переменные окружения

Скопируйте `.env.example` в `.env`, если нужно что-то поменять.

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `VITE_API_URL` | `/api` | Базовый URL API для браузера. Если бэкенд на другом домене — полный URL (тогда нужен CORS и `SameSite=None; Secure` cookie). |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8000` | Куда Vite проксирует `/api` в `dev`/`preview`. |

## Сессия и безопасность

- Вход: `POST /api/auth/login` с `refresh_token` **в теле**. В URL токен не попадает.
- Сессия — httpOnly cookie, которую ставит бэкенд. JS к ней доступа не имеет.
- В `localStorage` хранится **только тема** (`itd-studio:theme`).
- Любой ответ 401 сбрасывает сессию и переводит на `/login`.
- Внешние ссылки открываются с `rel="noopener noreferrer"`.

## Структура

```
src/
├── main.tsx                 точка входа, порядок подключения глобальных стилей
├── app/                     сборка приложения
│   ├── App.tsx              провайдеры: QueryClient, Theme, Router
│   ├── routes.tsx           маршруты (страницы грузятся лениво)
│   ├── queryClient.ts       настройки запросов, реакция на 401
│   ├── RequireAuth.tsx      защита маршрутов + SyncProvider
│   └── layout/              каркас: Sidebar, Topbar, MobileTabbar, Logo, navigation.ts, layout.css
├── pages/                   страницы — только раскладка готовых блоков фич
│   ├── DashboardPage  CommentsPage  AnalyticsPage  AudiencePage
│   ├── SettingsPage   HelpPage      LoginPage
│   └── pages.css
├── features/                бизнес-блоки: api.ts → hooks.ts → компоненты
│   ├── auth/                вход/выход, useSession
│   ├── sync/                запуск синхронизации, опрос статуса, баннер результата
│   ├── analytics/
│   │   ├── api.ts hooks.ts types.ts
│   │   ├── overview/        сводка, карточки метрик, лучшее время, топ-пост
│   │   ├── audience/        график подписчиков с источником, новые подписчики, «чего нет в API»
│   │   ├── engagement/      по дню публикации, динамика по снимкам, активность по дням недели
│   │   ├── posting-time/    средние метрики по часам публикации
│   │   └── posts/           таблица постов, метрики поста
│   ├── comments/            последние комментарии (из уведомлений), самые обсуждаемые посты
│   ├── settings/            часовой пояс, переключатель темы
│   └── features.css
└── shared/                  переиспользуемое, без знания о данных
    ├── api/                 client.ts (fetch + ApiError), queryKeys.ts
    ├── ui/                  Card, MetricCard, ChartContainer, EmptyState, ErrorState, Skeleton,
    │                        Button, Field, Tabs, Badge, InfoHint, Avatar, ChartTooltip, icons, ui.css
    ├── lib/                 format.ts (числа/даты ru-RU), constants.ts
    └── theme/               tokens.css (все цвета/размеры), themes.css (dark/light/vk), base.css,
                             ThemeProvider, useTheme
```

Правила:
- Компоненты `shared/ui` не делают запросов и не знают про API.
- Загрузка данных — только через хуки TanStack Query из `features/*/hooks.ts`. Ручных `useEffect`-загрузок нет.
- Цвета, отступы, радиусы и шрифты берутся только из CSS-переменных `shared/theme/tokens.css`.
  Тема — атрибут `data-theme` на `<html>`, темы переопределяют только цветовые токены.
- Ключи запросов лежат в `shared/api/queryKeys.ts`. После синхронизации инвалидируются все ветки данных.

## Честность данных в интерфейсе

- Ряд подписчиков подписан источником: «реальные снимки» (залитые точки) или «восстановлено по уведомлениям,
  без учёта отписок» (полые точки). Интерполяции нет.
- «Метрики постов по дню публикации» — сумма метрик постов, опубликованных в этот день, а **не** рост во времени.
- «Динамика по снимкам» пустая, пока снимков меньше двух.
- В «Лучшем времени» и по часам: часы с малой выборкой приглушены, при нехватке данных показывается причина.
- ER подписан как «ER по просмотрам», формула — в подсказке.
- На странице «Аудитория» есть блок «Чего нет в API итд»: отписки, даты подписки в списке подписчиков,
  демография, охват.
