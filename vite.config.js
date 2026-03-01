import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'], // <-- Remove this line to see console logs in production
  },
  // The esbuild 'drop' option below will automatically remove all console.* and debugger statements
  // from the final production build. This helps keep your production bundle clean and secure.
  // If you want to see console logs again in production, just delete or comment out the 'esbuild' block below.
  // In local development (npm run dev), console logs will still show as normal.
})
