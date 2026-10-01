# Google Sign-In configuration

1. Create a Web OAuth client in Google Cloud Console.
2. Add every deployed frontend origin and local development origin (for example `http://localhost:3000`) to **Authorized JavaScript origins**.
3. Set the same OAuth client ID in both environments:

```env
# backend/.env (server only)
GOOGLE_CLIENT_ID=your-web-oauth-client-id.apps.googleusercontent.com

# frontend/.env.local (public client identifier, not a secret)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-web-oauth-client-id.apps.googleusercontent.com
```

Do not place a Google client secret in the frontend. The backend verifies each Google ID token with `GOOGLE_CLIENT_ID` before creating the normal Smart Safar JWT. Google sign-in is intentionally restricted to commuter accounts.