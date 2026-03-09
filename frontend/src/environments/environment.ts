// ── Kisan OAuth2 PKCE Configuration ──────────────────────────
// Replace the placeholder values below with credentials
// provided by the Kisan team.
// See oauth-integration.md for the full integration guide.
// ──────────────────────────────────────────────────────────────
export const environment = {
  production: false,
  kisanClientId: 'd5f6da7b73a56d8e64bc6783ae3e1a1x',
  kisanOAuthUiUrl: 'https://farmer-auth-dev.kisan.in/authenticate',
  kisanOAuthApiUrl: 'https://api-development.kisan.io/api/farmers/auth/',
  kisanApiBaseUrl: 'https://api-development.kisan.io/api/farmers/',
  callbackUrl: 'http://localhost:3000/auth/callback',
  apiBaseUrl: 'http://localhost:5000/api',
};
