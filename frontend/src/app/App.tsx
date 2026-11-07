/** Корень приложения: провайдеры (данные, тема, роутер) и маршруты. */
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { ThemeProvider } from '@/shared/theme'
import { queryClient } from './queryClient'
import { AppRoutes } from './routes'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
