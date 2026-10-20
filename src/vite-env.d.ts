/// <reference types="vite/client" />

// Only public (browser-safe) settings belong here. Secrets such as the Gemini and
// Stripe secret keys are read by the /api server routes and never reach the browser.
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIRESTORE_DATABASE_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  readonly NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  readonly NEXT_PUBLIC_FIRESTORE_DATABASE_ID?: string;
  readonly NEXT_PUBLIC_APP_URL?: string;
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  readonly VITE_FIREBASE_EMULATOR_HOST?: string;
  readonly VITE_FIRESTORE_EMULATOR_PORT?: string;
  readonly VITE_AUTH_EMULATOR_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
