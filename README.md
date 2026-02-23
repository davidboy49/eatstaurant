# Eatstaurant

This is a Next.js application for restaurant operations with Firebase Authentication and Firestore.

## Local development

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local` using the Firebase web app credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

3. Start the development server.

```bash
npm run dev
```

## Where should env vars be set?

Short answer: **both**, but in different places for different environments.

- **Local development**: put them in `.env.local` (from `.env.example`).
- **Vercel deployment**: add the same keys in **Vercel Project Settings → Environment Variables**.

`NEXT_PUBLIC_*` variables are embedded at build time, so after editing them in Vercel you must **redeploy** for changes to take effect.

## Deploying to Vercel

If you see this browser error:

```text
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

it means your Firebase client environment variables are missing or incorrect in Vercel.

In **Vercel → Project → Settings → Environment Variables**, set these exact keys for your target environments (Production/Preview/Development):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

After updating variables, redeploy the project.

### Still seeing `auth/invalid-api-key` after setting env vars?

Check these common causes:

1. **Wrong Vercel environment scope**: ensure the keys are added to the environment you are deploying (`Production`, `Preview`, or `Development`).
2. **No redeploy after env change**: trigger a new deployment after editing variables.
3. **Quoted values**: do not include surrounding quotes in Vercel values (`AIza...`, not `"AIza..."`).
4. **Placeholder values**: do not use `...`; copy the real values from Firebase Console → Project Settings → Your apps → Web app config.
5. **Mismatched Firebase project**: make sure all six values come from the same Firebase project/app.

### Runtime debug page

A temporary debug page is available at `/debug-env` to verify what the deployed runtime is actually receiving for Firebase env vars.

It shows, per key:
- whether the value is set
- trimmed length
- whether there is whitespace padding
- whether the value is wrapped in quotes
- a masked preview

Use it to compare Production vs Preview deployments and confirm Vercel env propagation.

If `/debug-env` was blank before, this is now fixed by making auth initialization lazy so the diagnostics page can still render even when Firebase env config is broken.

