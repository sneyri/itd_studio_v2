/**
 * HTTP-клиент для backend API.
 * - базовый URL из VITE_API_URL (по умолчанию '/api', в dev проксируется Vite на :8000);
 * - всегда отправляет cookie сессии (credentials: 'include');
 * - разбирает ошибки формата { error: { code, message, retry_after? } } в ApiError;
 * - на 401 вызывает зарегистрированный обработчик (сброс сессии → /login).
 */

export type ApiErrorCode =
  | 'unauthorized'
  | 'invalid_token'
  | 'not_found'
  | 'validation_error'
  | 'sync_cooldown'
  | 'itd_unavailable'
  | 'internal_error'
  | 'network_error'
  | 'unknown'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly retryAfter: number | null

  constructor(status: number, code: ApiErrorCode, message: string, retryAfter: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

let onUnauthorized: (() => void) | null = null

/** Регистрирует реакцию на 401 (вызывается из app/ при старте). */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

type ErrorBody = { error?: { code?: string; message?: string; retry_after?: number | null } }

function fallbackMessage(status: number): string {
  if (status === 401) return 'Сессия истекла, войдите снова'
  if (status === 404) return 'Не найдено'
  if (status === 429) return 'Слишком много запросов, попробуйте позже'
  if (status >= 500) return 'Сервер временно недоступен'
  return 'Не удалось выполнить запрос'
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ErrorBody | null = null
  try {
    body = (await response.json()) as ErrorBody
  } catch {
    body = null
  }
  const code = (body?.error?.code as ApiErrorCode | undefined) ?? 'unknown'
  const message = body?.error?.message || fallbackMessage(response.status)
  const retryAfterHeader = Number(response.headers.get('Retry-After'))
  const retryAfter =
    body?.error?.retry_after ?? (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : null)
  return new ApiError(response.status, code, message, retryAfter)
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** не вызывать глобальный обработчик 401 (например, для /auth/me и /auth/login) */
  skipAuthRedirect?: boolean
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, skipAuthRedirect = false } = options
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'network_error', 'Нет связи с сервером. Проверьте, что backend запущен.')
  }

  if (!response.ok) {
    const error = await parseError(response)
    if (response.status === 401 && !skipAuthRedirect) onUnauthorized?.()
    throw error
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => apiRequest<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
}

/** Строка запроса из объекта, пропускает undefined/null. */
export function toQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}
