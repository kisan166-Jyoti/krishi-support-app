// ── Kisan OAuth2 PKCE Configuration ──────────────────────────
// Replace the placeholder values below with credentials
// provided by the Kisan team.
// See oauth-integration.md for the full integration guide.
// ──────────────────────────────────────────────────────────────
export const environment = {
  production: false,
  kisanClientId: 'YOUR_KISAN_CLIENT_ID',
  kisanOAuthUiUrl: 'YOUR_KISAN_OAUTH_UI_URL',
  kisanOAuthApiUrl: 'YOUR_KISAN_OAUTH_API_URL',
  kisanApiBaseUrl: 'YOUR_KISAN_API_BASE_URL',
  callbackUrl: 'http://localhost:3000/auth/callback',
  apiBaseUrl: 'http://localhost:5000/api',
};
