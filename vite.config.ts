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
      // GEMINI_API_KEY removed from client bundle — now server-side only (Edge Function)
      define: {},
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom', '@remix-run/router'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-radix': [
                '@radix-ui/react-alert-dialog',
                '@radix-ui/react-dialog',
                '@radix-ui/react-label',
                '@radix-ui/react-progress',
                '@radix-ui/react-select',
                '@radix-ui/react-separator',
                '@radix-ui/react-slot',
                '@radix-ui/react-toast',
              ],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
