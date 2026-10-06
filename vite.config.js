import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em dev: Vite roda na 5173 e faz proxy de /api para o servidor Node local (3001).
// Na Vercel: /api/* sao as funcoes da pasta api/ e o resto e o build estatico (dist/).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: { outDir: 'dist' },
});
