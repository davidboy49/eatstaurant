import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const requiredFirebaseEnvKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

const missingFirebaseEnvKeys = requiredFirebaseEnvKeys.filter((key) => !process.env[key]);
let hasAllFirebaseEnv = missingFirebaseEnvKeys.length === 0;

if (!hasAllFirebaseEnv) {
    // Log an error but do not throw so the client doesn't crash in production.
    // Recommend adding the vars to Vercel project settings for production.
    console.error(
        `Missing Firebase client env vars: ${missingFirebaseEnvKeys.join(", ")}. ` +
            "Add them to your local .env.local and to your Vercel project settings.",
    );
}

const firebaseConfig = hasAllFirebaseEnv
    ? {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
    : null;

const app = hasAllFirebaseEnv ? (!getApps().length ? initializeApp(firebaseConfig as any) : getApp()) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { app, auth, db, firebaseConfig, hasAllFirebaseEnv };
