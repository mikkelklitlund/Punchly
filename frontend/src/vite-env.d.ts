// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_STORAGE_TYPE: 'localStorage' | 'sessionStorage'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
