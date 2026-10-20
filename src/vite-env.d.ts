/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  readonly NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  readonly NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  readonly NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  readonly NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  readonly NEXT_PUBLIC_APP_URL?: string;
  readonly GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'firebase/app';
declare module 'firebase/firestore';
declare module 'firebase/auth';
declare module 'lucide-react';
