import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: In Next.js, NEXT_PUBLIC_ env vars MUST be accessed via literal
// property names — NOT dynamic bracket access like process.env[key], which
// always returns undefined because Next.js statically inlines these at build time.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasAllFirebaseEnv = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
);

if (!hasAllFirebaseEnv) {
    console.error(
        "Missing Firebase configuration. Ensure all NEXT_PUBLIC_FIREBASE_* keys " +
        "are in .env.local (local dev) and Vercel project settings (production)."
    );
}

// Firebase client SDK is browser-only. During Next.js SSR/static generation
// (e.g. /_not-found rendering the root layout), we return null stubs.
// All pages that actually call Firebase are "use client" so stubs are never invoked.
const isBrowser = typeof window !== "undefined";

/* eslint-disable @typescript-eslint/no-explicit-any */
const app = (isBrowser && hasAllFirebaseEnv)
    ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
    : null;
const auth = app ? getAuth(app) : null as any;
const db = app ? getFirestore(app) : null as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export { app, auth, db, firebaseConfig, hasAllFirebaseEnv };
