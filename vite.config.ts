import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig, loadEnv} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Safely check if firebase-applet-config.json exists on disk (e.g. in local/AI Studio environment)
  let fileConfig: Record<string, string> = {};
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      // Ignored if missing or corrupted
    }
  }

  const apiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY || fileConfig.apiKey || '';
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN || fileConfig.authDomain || '';
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID || fileConfig.projectId || '';
  const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket || '';
  const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId || '';
  const appId = env.VITE_FIREBASE_APP_ID || env.FIREBASE_APP_ID || fileConfig.appId || '';
  const databaseId = env.VITE_FIREBASE_DATABASE_ID || env.FIREBASE_DATABASE_ID || fileConfig.firestoreDatabaseId || '';
  const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID || env.FIREBASE_MEASUREMENT_ID || fileConfig.measurementId || '';

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
        VITE_FIREBASE_API_KEY: apiKey,
        VITE_FIREBASE_AUTH_DOMAIN: authDomain,
        VITE_FIREBASE_PROJECT_ID: projectId,
        VITE_FIREBASE_STORAGE_BUCKET: storageBucket,
        VITE_FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
        VITE_FIREBASE_APP_ID: appId,
        VITE_FIREBASE_DATABASE_ID: databaseId,
        VITE_FIREBASE_MEASUREMENT_ID: measurementId,
        FIREBASE_API_KEY: apiKey,
        FIREBASE_AUTH_DOMAIN: authDomain,
        FIREBASE_PROJECT_ID: projectId,
        FIREBASE_STORAGE_BUCKET: storageBucket,
        FIREBASE_MESSAGING_SENDER_ID: messagingSenderId,
        FIREBASE_APP_ID: appId,
        FIREBASE_DATABASE_ID: databaseId,
        FIREBASE_MEASUREMENT_ID: measurementId,
      }),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
