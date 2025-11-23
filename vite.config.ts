import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy para API routes em desenvolvimento
          // Redireciona /api/* para o servidor de API na porta 3001
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path, // Mantém o path original
          },
        },
      },
      plugins: [react()],
      publicDir: 'public',
      define: {
        // ⚠️ IMPORTANTE: GEMINI_API_KEY NÃO deve ser exposta no cliente
        // Apenas variáveis com prefixo VITE_ são expostas no cliente
        // GEMINI_API_KEY deve estar apenas no servidor (Vercel Edge Function)
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL || env.VITE_SUPABASE_URL),
        'process.env.REACT_APP_SUPABASE_KEY': JSON.stringify(env.REACT_APP_SUPABASE_KEY || env.VITE_SUPABASE_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: {
              // Separa React e React DOM em um chunk separado
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              // Separa Google GenAI (é uma biblioteca grande)
              'genai-vendor': ['@google/genai'],
              // Separa Supabase
              'supabase-vendor': ['@supabase/supabase-js'],
            },
          },
        },
        // Aumenta o limite de aviso para 600KB já que estamos dividindo em chunks
        chunkSizeWarningLimit: 600,
      },
    };
});
