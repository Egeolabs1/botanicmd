import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Mantém compatibilidade com process.env
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
        'process.env.REACT_APP_SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL || env.VITE_SUPABASE_URL),
        'process.env.REACT_APP_SUPABASE_KEY': JSON.stringify(env.REACT_APP_SUPABASE_KEY || env.VITE_SUPABASE_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
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
