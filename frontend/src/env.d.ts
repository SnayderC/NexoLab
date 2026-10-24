/// <reference types="vite/client" />

// Variables de entorno que usa el frontend (ver .env.example).
interface ImportMetaEnv {
  readonly VITE_DEMO_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
