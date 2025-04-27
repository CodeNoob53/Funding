import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Додаємо змінні середовища, які починаються з "VITE_"
  envPrefix: 'VITE_',
  // Оптимізуємо збірку
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Оптимізуємо для продакшн
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3031,
    open: true,
  },
})