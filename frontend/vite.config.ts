import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev server on 5173; the API base URL comes from VITE_API_URL, so no proxy is needed.
// The "@/..." alias must stay in sync with "paths" in tsconfig.json - TypeScript reads
// the tsconfig one, Vite reads this one, and they are not connected.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
