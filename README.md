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
