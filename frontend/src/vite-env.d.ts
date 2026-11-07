/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый URL backend API. По умолчанию '/api' (в dev проксируется Vite на http://127.0.0.1:8000). */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
