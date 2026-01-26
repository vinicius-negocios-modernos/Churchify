
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Necessário para funcionar em containers/cloud
    port: 5173,
  },
  // Evita erro de "process is not defined" que causa tela branca em alguns navegadores
  define: {
    'process.env': process.env
  }
})
