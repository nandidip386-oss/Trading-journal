import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env': JSON.stringify({
        NODE_ENV: mode,
        VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || '',
        VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || '',
        VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || '',
        VITE_FIREBASE_STORAGE_BUCKET: env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || '',
        VITE_FIREBASE_MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || '',
        VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || '',
        VITE_FIREBASE_DATABASE_ID: env.VITE_FIREBASE_DATABASE_ID || env.FIREBASE_DATABASE_ID || '',
        VITE_FIREBASE_MEASUREMENT_ID: env.VITE_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || '',
        FIREBASE_API_KEY: env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY || '',
        FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN || env.VITE_FIREBASE_AUTH_DOMAIN || '',
        FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '',
        FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET || env.VITE_FIREBASE_STORAGE_BUCKET || '',
        FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
        FIREBASE_APP_ID: env.FIREBASE_APP_ID || env.VITE_FIREBASE_APP_ID || '',
        FIREBASE_DATABASE_ID: env.FIREBASE_DATABASE_ID || env.VITE_FIREBASE_DATABASE_ID || '',
        FIREBASE_MEASUREMENT_ID: env.FIREBASE_MEASUREMENT_ID || env.VITE_FIREBASE_MEASUREMENT_ID || '',
      }),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

