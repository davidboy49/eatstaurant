import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase client SDK is browser-only. During Next.js server-side rendering
// or static page generation, we return safe stubs. All code that actually
// calls Firebase lives in "use client" components, so stubs are never invoked.
const isBrowser = typeof window !== "undefined";

/* eslint-disable @typescript-eslint/no-explicit-any */
const app = isBrowser ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : ({} as any);
const auth = isBrowser ? getAuth(app) : ({} as any);
const db = isBrowser ? getFirestore(app) : ({} as any);
/* eslint-enable @typescript-eslint/no-explicit-any */

export { app, auth, db };

