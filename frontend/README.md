# ITD Studio — frontend

React 19 + Vite + TypeScript. Данные — TanStack Query, маршруты — react-router, графики — Recharts.
Контракт с бэкендом — HTTP API из корневого README (интерактивно: `http://127.0.0.1:8000/docs`).

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
│   ├── DashboardPage  NotificationsPage  CommentsPage  AnalyticsPage  AudiencePage
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
│   │   └── posts/           таблица постов (фильтр медиа, раскрытие), PostMedia (фото/видео/лайтбокс), метрики
│   ├── notifications/       уведомления: сводка, фильтры в URL, список с подгрузкой
│   ├── comments/            последние комментарии (из уведомлений), самые обсуждаемые посты
│   ├── settings/            часовой пояс, переключатель темы
│   └── features.css
└── shared/                  переиспользуемое, без знания о данных
    ├── api/                 client.ts (fetch + ApiError), queryKeys.ts
    ├── ui/                  Card, MetricCard, ChartContainer, EmptyState, ErrorState, Skeleton,
    │                        Button, Field (Input), Dropdown (Select / MultiSelect / поиск), Lightbox,
    │                        VerifiedBadge, Tabs, Badge, InfoHint, Avatar, ChartTooltip, icons, ui.css, controls.css
    ├── lib/                 format.ts (числа/даты ru-RU), constants.ts, useDebouncedValue.ts
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

## Медиа постов

`Post.attachments` — картинки, видео, аудио и файлы. `PostMedia` рисует сетку картинок (1 / 2 / 3 / 4+, «+N»
на последней), по клику — лайтбокс (Esc, ←/→, клик по фону). Видео — нативный плеер с `preload="metadata"`.
Если файл в CDN итд недоступен — плейсхолдер «Медиа недоступно». В списках — миниатюра 48px и бейдж
«N фото / видео». Если бэкенд отвечает `attachments_synced: false`, показывается подсказка синхронизироваться.

## Уведомления (`/notifications`)

- Сводка: всего, непрочитанные, от верифицированных / без галочки / статус неизвестен, график за 30 дней,
  чипы типов (быстрый фильтр), топ-10 активных пользователей (клик = фильтр по автору).
- Фильтры хранятся в URL (`?types=like&types=follow&actor=…&verified=true&unread=true&q=…&date_from=…&date_to=…&sort=old`),
  поэтому ссылкой на выборку можно поделиться, а «Назад» возвращает предыдущий фильтр.
- Поиск по тексту — с задержкой 300 мс; выбор автора — список с поиском по `/api/notifications/actors`.
- Список подгружается по 30 штук («Показать ещё»).

## Выпадающие списки

Нативных `<select>` в проекте нет: `shared/ui/Dropdown.tsx` даёт `Select`, `MultiSelect` и режим `searchable`.
Панель рендерится порталом (не обрезается карточками), открывается вверх, если снизу мало места, на узких экранах —
по ширине поля. Клавиатура: ↑/↓, Home/End, Enter/Space, Esc, Tab, поиск по первым буквам; ARIA listbox/option.
