import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  connectAuthEmulator,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';

const env = import.meta.env;

/** True when running against the local Firebase emulators (never touches real data). */
export const useEmulators = env.VITE_USE_FIREBASE_EMULATORS === 'true';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || (useEmulators ? 'demo-api-key' : ''),
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (useEmulators ? 'demo-lawyerselect' : ''),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || (useEmulators ? 'demo-app-id' : ''),
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-9RX4ESGDEG',
};

const databaseId = env.VITE_FIRESTORE_DATABASE_ID || env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || 'lawyerselect';

const required = useEmulators
  ? (['projectId'] as const)
  : (['apiKey', 'authDomain', 'projectId', 'appId'] as const);
const missing = required.filter((key) => !firebaseConfig[key]);

/** Set when the site was deployed without its Firebase settings; the app shows a setup screen instead of crashing. */
export const firebaseConfigError: string | null = missing.length
  ? `The site's Firebase settings are missing (${missing.join(', ')}). Add them as NEXT_PUBLIC_FIREBASE_* environment variables.`
  : null;

let app = undefined as unknown as FirebaseApp;
let db = undefined as unknown as Firestore;
let auth = undefined as unknown as Auth;
let analytics = undefined as unknown as Analytics | null;

if (!firebaseConfigError) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // Initialize Analytics when supported in browser environment
  if (typeof window !== 'undefined') {
    isAnalyticsSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch {
          // Analytics non-blocking
        }
      }
    });
  }

  // Memory-only cache: confidential case details and chats are never written to the
  // browser's disk, so nothing is left behind on a shared or public computer.
  try {
    db = initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true }, databaseId);
  } catch {
    db = getFirestore(app, databaseId); // already initialised (hot reload)
  }

  // Sessions last only until the browser tab is closed unless the person ticks
  // "Keep me signed in". Falls back to memory when browser storage is blocked.
  try {
    auth = initializeAuth(app, {
      persistence: [browserSessionPersistence, inMemoryPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    auth = getAuth(app);
  }

  const flags = globalThis as { __lawyerSelectEmulatorsConnected?: boolean };
  if (useEmulators && !flags.__lawyerSelectEmulatorsConnected) {
    const host = env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';
    connectFirestoreEmulator(db, host, Number(env.VITE_FIRESTORE_EMULATOR_PORT || 8080));
    connectAuthEmulator(auth, `http://${host}:${env.VITE_AUTH_EMULATOR_PORT || 9099}`, { disableWarnings: true });
    flags.__lawyerSelectEmulatorsConnected = true;
  }
}

export { app, db, auth, analytics };

export const APP_TAG = 'lawyerselect';
