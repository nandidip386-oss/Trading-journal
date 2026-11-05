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
import fallbackConfig from '../../firebase-applet-config.json';

/**
 * Helper to retrieve environment variables from process.env (or import.meta.env in Vite)
 * with graceful fallback to the generated firebase-applet-config.json.
 */
function getEnvValue(key: string, viteKey: string, fallback?: string): string {
  // Check process.env (as injected or configured in vite.config.ts / Node.js)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key]!;
    if (process.env[viteKey]) return process.env[viteKey]!;
  }
  // Check Vite's import.meta.env
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env;
    if (metaEnv[viteKey]) return metaEnv[viteKey];
    if (metaEnv[key]) return metaEnv[key];
  }
  return fallback || '';
}

// Read Firebase credentials from process.env
export const firebaseConfig = {
  apiKey: getEnvValue('FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY', fallbackConfig.apiKey),
  authDomain: getEnvValue('FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN', fallbackConfig.authDomain),
  projectId: getEnvValue('FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID', fallbackConfig.projectId),
  storageBucket: getEnvValue('FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET', fallbackConfig.storageBucket),
  messagingSenderId: getEnvValue('FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID', fallbackConfig.messagingSenderId),
  appId: getEnvValue('FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID', fallbackConfig.appId),
  measurementId: getEnvValue('FIREBASE_MEASUREMENT_ID', 'VITE_FIREBASE_MEASUREMENT_ID', fallbackConfig.measurementId),
};

// Database ID for Firestore (custom or default)
export const firestoreDatabaseId = getEnvValue(
  'FIREBASE_DATABASE_ID',
  'VITE_FIREBASE_DATABASE_ID',
  fallbackConfig.firestoreDatabaseId
);

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

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

/**
 * Validate connection to Firestore on initial boot
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
      return false;
    }
    // Connection test is benign, permission denied on dummy test doc is standard expected behavior
    return true;
  }
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
