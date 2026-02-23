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

const normalizeFirebaseEnvValue = (value: string | undefined) => {
    if (!value) {
        return "";
    }

    const trimmed = value.trim();

    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim();
    }

    return trimmed;
};

const firebaseEnv = Object.fromEntries(
    requiredFirebaseEnvKeys.map((key) => [key, normalizeFirebaseEnvValue(process.env[key])]),
) as Record<(typeof requiredFirebaseEnvKeys)[number], string>;

const invalidFirebaseEnvKeys = requiredFirebaseEnvKeys.filter((key) => {
    const value = firebaseEnv[key];
    return value.length === 0 || value === "...";
});

if (invalidFirebaseEnvKeys.length > 0) {
    throw new Error(
        `Missing or invalid Firebase client env vars: ${invalidFirebaseEnvKeys.join(", ")}. ` +
            "Use real Firebase Web App values (not placeholders), then redeploy Vercel.",
    );
}

const firebaseConfig = {
    apiKey: firebaseEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: firebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: firebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: firebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: firebaseEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: firebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
