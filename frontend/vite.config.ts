import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // La API de Django se sirve por el mismo origen que la aplicación: así la cookie de sesión
    // y la de CSRF funcionan sin configurar CORS (decisión D-25).
    // changeOrigin: false conserva el Host del navegador, para que la verificación de origen
    // de la protección CSRF de Django vea la misma dirección que envía el navegador.
    // API_PROXY_TARGET lo define docker compose (http://backend:8000); fuera de Docker, Django corre en el equipo.
    proxy: {
      '/api': { target: process.env.API_PROXY_TARGET ?? 'http://localhost:8000', changeOrigin: false },
    },
  },
})
