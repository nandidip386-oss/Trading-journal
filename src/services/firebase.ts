import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';

/**
 * Helper to retrieve environment variables from process.env or Vite's import.meta.env
 */
function getEnvValue(key: string, viteKey: string, fallback: string = ''): string {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return String(process.env[key]).trim();
    if (process.env[viteKey]) return String(process.env[viteKey]).trim();
  }
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env;
    if (metaEnv[viteKey]) return String(metaEnv[viteKey]).trim();
    if (metaEnv[key]) return String(metaEnv[key]).trim();
  }
  return fallback;
}

// Read Firebase credentials from process.env / import.meta.env
export const firebaseConfig = {
  apiKey: getEnvValue('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
  authDomain: getEnvValue('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvValue('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvValue('FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvValue('FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvValue('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'),
  measurementId: getEnvValue('FIREBASE_MEASUREMENT_ID', 'VITE_FIREBASE_MEASUREMENT_ID'),
};

// Database ID for Firestore (custom or default)
export const firestoreDatabaseId = getEnvValue(
  'FIREBASE_DATABASE_ID',
  'VITE_FIREBASE_DATABASE_ID'
);

// Fallback configuration if env vars are completely unset in production
const activeConfig = firebaseConfig.apiKey ? firebaseConfig : {
  apiKey: 'dummy-api-key',
  authDomain: 'dummy-app.firebaseapp.com',
  projectId: 'dummy-project',
  storageBucket: 'dummy-app.firebasestorage.app',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:dummy'
};

if (!firebaseConfig.apiKey) {
  console.warn(
    '[MyFx Journal] Firebase environment variables (VITE_FIREBASE_API_KEY, etc.) are not set. ' +
    'Please configure them in your Vercel Project Settings > Environment Variables or in your local .env file.'
  );
}

// Initialize Firebase App
const app = initializeApp(activeConfig);

// Initialize Firestore with specific database ID if specified, otherwise default
export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
      return false;
    }
    return true;
  }
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
