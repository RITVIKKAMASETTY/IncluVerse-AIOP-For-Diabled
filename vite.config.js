import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
<<<<<<< HEAD
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    
    tailwindcss(),
    react()
  ],
})
=======

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',                      // Required for local dev on Render
    port: process.env.PORT || 5173       // Use dynamic port or fallback
  },
  preview: {
    host: '0.0.0.0',                      // Required for deployment
    port: process.env.PORT || 4173,      // Render sets PORT env var
    allowedHosts: ['incluverse-aiop-for-diabled.onrender.com']  // Explicitly allow your domain
  },
  plugins: [react()]
})
>>>>>>> f04caa28cdc5691db7a75c8e069e3fe46d66b8dc
