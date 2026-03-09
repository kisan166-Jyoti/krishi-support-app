# OAuth2 PKCE Integration Guide for Third-Party Applications

This document describes how to integrate with the Kisan OAuth2 service using the Authorization Code flow with PKCE (Proof Key for Code Exchange). PKCE eliminates the need for a client secret and is the recommended flow for browser-based and mobile applications.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Authentication Flow](#authentication-flow)
4. [Step-by-Step Implementation](#step-by-step-implementation)
   - [Step 1: Generate PKCE Code Verifier and Challenge](#step-1-generate-pkce-code-verifier-and-challenge)
   - [Step 2: Save State and Redirect to OAuth Server](#step-2-save-state-and-redirect-to-oauth-server)
   - [Step 3: Handle the Callback](#step-3-handle-the-callback)
   - [Step 4: Exchange Authorization Code for Tokens](#step-4-exchange-authorization-code-for-tokens)
   - [Step 5: Decode and Store Tokens](#step-5-decode-and-store-tokens)
   - [Step 6: Make Authenticated API Requests](#step-6-make-authenticated-api-requests)
5. [Token Reference](#token-reference)
6. [Session Expiry and Re-authentication](#session-expiry-and-re-authentication)
7. [Logout](#logout)
8. [Security Considerations](#security-considerations)
9. [Code Examples](#code-examples)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Kisan OAuth2 service uses the **Authorization Code flow with PKCE** (RFC 7636). This is a two-step process:

1. Your application redirects the user to the Kisan OAuth UI with a **code challenge**.
2. After the user authenticates, the OAuth UI redirects back to your application with an **authorization code**.
3. Your application exchanges the authorization code (along with the original **code verifier**) for access and identity tokens.

No client secret is required. The PKCE mechanism ensures that only the application that initiated the flow can complete the token exchange.

---

## Prerequisites

| Item | Description |
|------|-------------|
| **Client ID** | A unique identifier for your application, provided by the Kisan team. |
| **Callback URL** | A URL in your application that will receive the authorization code after login (e.g., `https://yourapp.com/auth/callback`). Share this with the Kisan team during onboarding. |
| **OAuth UI URL** | The Kisan OAuth login page URL. `{KISAN_OAUTH_UI_URL}` |
| **OAuth API URL** | The Kisan OAuth API base URL for token exchange. `{KISAN_OAUTH_API_URL}` |

> The Kisan team will provide you with the **Client ID**, **OAuth UI URL**, and **OAuth API URL** for your target environment.

---

## Authentication Flow

```
┌──────────────┐                    ┌──────────────────┐                    ┌──────────────┐
│              │                    │                  │                    │              │
│  Your App    │                    │  Kisan OAuth UI  │                    │  Kisan OAuth │
│  (Browser)   │                    │  (Login Page)    │                    │  API Server  │
│              │                    │                  │                    │              │
└──────┬───────┘                    └────────┬─────────┘                    └──────┬───────┘
       │                                     │                                    │
       │  1. Generate code_verifier          │                                    │
       │     & code_challenge (SHA-256)      │                                    │
       │                                     │                                    │
       │  2. Save code_verifier locally      │                                    │
       │                                     │                                    │
       │  3. Redirect user ─────────────────>│                                    │
       │     ?response_type=code             │                                    │
       │     &client_id=YOUR_CLIENT_ID       │                                    │
       │     &code_challenge=CHALLENGE       │                                    │
       │     &state=CSRF_STATE               │                                    │
       │                                     │                                    │
       │                                     │  User logs in                      │
       │                                     │  (phone/email/OTP)                 │
       │                                     │                                    │
       │  4. Redirect back <─────────────────│                                    │
       │     ?code=AUTH_CODE                 │                                    │
       │     &auth_progress_id=AUTH_KEY      │                                    │
       │     &state=CSRF_STATE               │                                    │
       │                                     │                                    │
       │  5. Validate state parameter        │                                    │
       │                                     │                                    │
       │  6. POST token exchange ────────────────────────────────────────────────>│
       │     { code, code_verifier,          │                                    │
       │       auth_progress_id }            │                                    │
       │                                     │                                    │
       │  7. Receive tokens <────────────────────────────────────────────────────│
       │     { access_token, id_token,       │                                    │
       │       refresh_token, expires_in }   │                                    │
       │                                     │                                    │
       │  8. Decode & store tokens           │                                    │
       │                                     │                                    │
       │  9. Use id_token for API calls      │                                    │
       │     Authorization: {id_token}│                                    │
       │                                     │                                    │
```

---

## Step-by-Step Implementation

### Step 1: Generate PKCE Code Verifier and Challenge

Before redirecting the user, generate a cryptographic code verifier and its SHA-256 challenge.

**Code Verifier:**
- A random string, **128 characters** long
- Characters: `A-Z`, `a-z`, `0-9`

**Code Challenge:**
- SHA-256 hash of the code verifier
- Hex-encoded (lowercase)

```javascript
// Generate a 128-character random alphanumeric string
function generateCodeVerifier(length = 128) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Compute SHA-256 hash (hex-encoded) of the verifier
async function computeCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
```

> **Important:** Store the `code_verifier` securely (e.g., `sessionStorage` or `localStorage`). You will need it in Step 4 to exchange the authorization code for tokens.

---

### Step 2: Save State and Redirect to OAuth Server

Build the authorization URL and redirect the user's browser to it.

**Authorization URL format:**

```
{KISAN_OAUTH_UI_URL}?response_type=code&client_id={CLIENT_ID}&code_challenge={CODE_CHALLENGE}&state={STATE}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `response_type` | Yes | Always `code` |
| `client_id` | Yes | Your application's Client ID (provided by Kisan team) |
| `code_challenge` | Yes | SHA-256 hex hash of your code verifier |
| `state` | Yes | An opaque value used to prevent CSRF attacks. Store this before redirecting and validate it on callback. You can also use it to remember where to send the user after login (e.g., `/dashboard`). |
| `ref_source` | No | Optional referral tracking parameter |

```javascript
function startLogin() {
  const verifier = generateCodeVerifier();
  const challenge = await computeCodeChallenge(verifier);

  // Save verifier and state for later
  sessionStorage.setItem("pkce_code_verifier", verifier);

  const state = "/dashboard"; // or any post-login route
  sessionStorage.setItem("oauth_state", state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: "YOUR_CLIENT_ID",
    code_challenge: challenge,
    state: state,
  });

  // Redirect the browser to Kisan OAuth login page
  window.location.replace(`{KISAN_OAUTH_UI_URL}?${params.toString()}`);
}
```

The user will see the Kisan login page where they can authenticate via phone number, email, or OTP.

---

### Step 3: Handle the Callback

After the user authenticates, the OAuth server redirects the browser to your callback URL with query parameters.

**Callback URL format:**

```
https://yourapp.com/auth/callback?code={AUTH_CODE}&auth_progress_id={AUTH_KEY}&state={STATE}
```

| Parameter | Description |
|-----------|-------------|
| `code` | The authorization code to exchange for tokens |
| `auth_progress_id` | The authentication session identifier (required for token exchange) |
| `state` | The same state value you sent in Step 2 |
| `ref_source` | Referral source (if originally provided) |

**Validation:**

1. Verify that `code` and `auth_progress_id` are present.
2. Verify that the returned `state` matches what you stored in Step 2 (CSRF protection).
3. If validation passes, proceed to token exchange.

```javascript
function handleCallback() {
  const params = new URLSearchParams(window.location.search);

  const code = params.get("code");
  const authKey = params.get("auth_progress_id");
  const returnedState = params.get("state");

  // Validate required parameters
  if (!code || !authKey) {
    throw new Error("Missing authorization parameters");
  }

  // Validate state to prevent CSRF
  const savedState = sessionStorage.getItem("oauth_state");
  if (returnedState !== savedState) {
    throw new Error("State mismatch – possible CSRF attack");
  }

  // Proceed to token exchange
  exchangeCodeForTokens(authKey, code);
}
```

---

### Step 4: Exchange Authorization Code for Tokens

Send a POST request to the Kisan OAuth API to exchange the authorization code for tokens.

**Endpoint:**

```
POST {KISAN_OAUTH_API_URL}challenge/
```

**Request Headers:**

```
Content-Type: application/json
```

> This request does NOT require an Authorization header.

**Request Body:**

```json
{
  "action": "farmer_signin",
  "challenge_name": "code_exchange",
  "challenge_data": {
    "auth_progress_id": "{AUTH_KEY}",
    "grant_type": "authorization_code",
    "code": "{AUTH_CODE}",
    "code_verifier": "{CODE_VERIFIER}"
  }
}
```

| Field | Description |
|-------|-------------|
| `action` | Always `"farmer_signin"` |
| `challenge_name` | Always `"code_exchange"` |
| `challenge_data.auth_progress_id` | The `auth_progress_id` from the callback URL |
| `challenge_data.grant_type` | Always `"authorization_code"` |
| `challenge_data.code` | The `code` from the callback URL |
| `challenge_data.code_verifier` | The original code verifier you generated in Step 1 |

**Implementation:**

```javascript
async function exchangeCodeForTokens(authKey, code) {
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier – cannot complete login");
  }

  const response = await fetch("{KISAN_OAUTH_API_URL}challenge/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "farmer_signin",
      challenge_name: "code_exchange",
      challenge_data: {
        auth_progress_id: authKey,
        grant_type: "authorization_code",
        code: code,
        code_verifier: codeVerifier,
      },
    }),
  });

  const result = await response.json();

  if (response.ok && result.data?.tokens) {
    // Clean up PKCE verifier
    sessionStorage.removeItem("pkce_code_verifier");
    sessionStorage.removeItem("oauth_state");

    // Store tokens
    storeTokens(result.data.tokens);
  } else {
    throw new Error(result.message || "Token exchange failed");
  }
}
```

**Success Response (HTTP 200):**

```json
{
  "status": "success",
  "message": "Authentication successful",
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1...",
      "id_token": "eyJhbGciOiJSUzI1NiIs...",
      "refresh_token": "dGhpcyBpcyBhIHJlZn...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  }
}
```

**Error Response:**

```json
{
  "status": "error",
  "message": "Invalid code verifier"
}
```

---

### Step 5: Decode and Store Tokens

After a successful token exchange, decode the `id_token` (a JWT) and store relevant data.

**Token fields returned:**

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | Access token |
| `id_token` | string | JWT identity token — **used for authenticating API requests** |
| `refresh_token` | string | Refresh token (not used for refresh; re-authenticate on expiry) |
| `token_type` | string | Always `"Bearer"` |
| `expires_in` | number | Token lifetime in seconds |

**Decoding the id_token (JWT):**

The `id_token` is a standard JWT with three base64url-encoded parts separated by dots: `header.payload.signature`. You only need to decode the **payload** (middle part).

```javascript
function decodeJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  // Decode base64url payload
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(payload)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(json);
}
```

**JWT Payload Structure:**

```json
{
  "sub": "12345",
  "exp": 1700000000,
  "iat": 1699996400
}
```

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | string | The authenticated user's unique ID |
| `exp` | number | Token expiration time (UNIX timestamp in seconds) |
| `iat` | number | Token issued-at time (UNIX timestamp in seconds) |

**Storing tokens:**

```javascript
function storeTokens(tokens) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + tokens.expires_in;

  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("id_token", tokens.id_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("expires_at", expiresAt.toString());

  // Decode and store user info from id_token
  const payload = decodeJwt(tokens.id_token);
  localStorage.setItem("id_token_payload", JSON.stringify(payload));
  localStorage.setItem("user_id", payload.sub);
}
```

---

### Step 6: Make Authenticated API Requests

Include the `id_token` in the `Authorization` header for all authenticated API calls to the Kisan API.

**Header format:**

```
Authorization: {id_token}
```

**Example:**

```javascript
async function fetchProtectedResource(endpoint) {
  const idToken = localStorage.getItem("id_token");

  if (!idToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(endpoint, {
    headers: {
      "Authorization": ` ${idToken}`,
      "Content-Type": "application/json",
    },
  });

  return response.json();
}
```

---

## Token Reference

**Summary of all stored values:**

| Key | Value | Purpose |
|-----|-------|---------|
| `access_token` | Raw token string | Access token |
| `id_token` | JWT string | Used in `Authorization` header for API calls |
| `refresh_token` | Raw token string | Stored but not used for refresh |
| `expires_at` | UNIX timestamp (seconds, as string) | Token expiration time |
| `id_token_payload` | JSON string | Decoded JWT payload for quick access |
| `user_id` | String | Authenticated user's ID (from JWT `sub` claim) |
| `pkce_code_verifier` | 128-char string | Temporary — delete after token exchange |
| `oauth_state` | String | Temporary — delete after callback validation |

---

## Session Expiry and Re-authentication

Tokens have a finite lifetime defined by `expires_in` (in seconds). When a token expires:

1. **Check expiration before making API calls:**

```javascript
function isAuthenticated() {
  const idToken = localStorage.getItem("id_token");
  const expiresAt = parseInt(localStorage.getItem("expires_at") || "0", 10);
  const now = Math.floor(Date.now() / 1000);

  return !!idToken && now < expiresAt;
}
```

2. **If expired, clear stored tokens and restart the login flow:**

```javascript
function handleExpiredSession() {
  clearAuthData();
  startLogin(); // Redirect to OAuth server (Step 2)
}
```

> **Note:** There is no token refresh mechanism. When the session expires, the user must re-authenticate by going through the full PKCE flow again.

---

## Logout

To log the user out, clear all authentication data from storage:

```javascript
function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("expires_at");
  localStorage.removeItem("id_token_payload");
  localStorage.removeItem("user_id");

  // Redirect to your app's public page
  window.location.href = "/";
}
```

---

## Security Considerations

### PKCE Verifier Storage
- Store the `pkce_code_verifier` in `sessionStorage` (preferred over `localStorage` since it's only needed during the login flow and should not persist across tabs).
- Delete it immediately after the token exchange completes.

### State Parameter (CSRF Protection)
- Always generate and validate the `state` parameter.
- Compare the `state` returned in the callback with the one you stored before redirecting.
- Reject the callback if they don't match.

### Token Storage
- Store tokens in `localStorage` or `sessionStorage` depending on your session requirements.
- Never expose tokens in URLs, logs, or error messages.
- Clear all tokens on logout.

### HTTPS
- Always use HTTPS for your callback URL and all API calls.
- Never transmit tokens over unencrypted connections.

### Token Expiry
- Always check token expiry before making API calls.
- Do not cache or use tokens beyond their `expires_at` time.

---

## Code Examples

### Complete Integration (Vanilla JavaScript)

```javascript
// ── Configuration ──────────────────────────────────────────────
const CONFIG = {
  clientId: "YOUR_CLIENT_ID",                      // Provided by Kisan team
  oauthUiUrl: "{KISAN_OAUTH_UI_URL}",             // Kisan login page
  oauthApiUrl: "{KISAN_OAUTH_API_URL}",           // Kisan API base
  callbackUrl: "https://yourapp.com/auth/callback", // Your callback
};

// ── PKCE Helpers ───────────────────────────────────────────────
function generateCodeVerifier(length = 128) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function computeCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── JWT Decoder ────────────────────────────────────────────────
function decodeJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(payload)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json);
}

// ── Auth State ─────────────────────────────────────────────────
function isAuthenticated() {
  const token = localStorage.getItem("id_token");
  const expiresAt = parseInt(localStorage.getItem("expires_at") || "0", 10);
  return !!token && Math.floor(Date.now() / 1000) < expiresAt;
}

function getAuthHeaders() {
  const token = localStorage.getItem("id_token");
  return token ? { Authorization: `${token}` } : {};
}

function getUserId() {
  return localStorage.getItem("user_id");
}

// ── Step 1 & 2: Start Login ───────────────────────────────────
async function startLogin(postLoginRoute = "/") {
  const verifier = generateCodeVerifier();
  const challenge = await computeCodeChallenge(verifier);

  sessionStorage.setItem("pkce_code_verifier", verifier);
  sessionStorage.setItem("oauth_state", postLoginRoute);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CONFIG.clientId,
    code_challenge: challenge,
    state: postLoginRoute,
  });

  window.location.replace(`${CONFIG.oauthUiUrl}?${params}`);
}

// ── Step 3 & 4: Handle Callback ───────────────────────────────
async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const authKey = params.get("auth_progress_id");
  const state = params.get("state");

  if (!code || !authKey) throw new Error("Missing authorization parameters");

  const savedState = sessionStorage.getItem("oauth_state");
  if (state !== savedState) throw new Error("State mismatch");

  const verifier = sessionStorage.getItem("pkce_code_verifier");
  if (!verifier) throw new Error("Missing PKCE code verifier");

  const response = await fetch(`${CONFIG.oauthApiUrl}challenge/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "farmer_signin",
      challenge_name: "code_exchange",
      challenge_data: {
        auth_progress_id: authKey,
        grant_type: "authorization_code",
        code: code,
        code_verifier: verifier,
      },
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.data?.tokens) {
    throw new Error(result.message || "Token exchange failed");
  }

  // Clean up temporary PKCE data
  sessionStorage.removeItem("pkce_code_verifier");
  sessionStorage.removeItem("oauth_state");

  // Store tokens
  const tokens = result.data.tokens;
  const now = Math.floor(Date.now() / 1000);
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("id_token", tokens.id_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("expires_at", (now + tokens.expires_in).toString());

  const payload = decodeJwt(tokens.id_token);
  localStorage.setItem("id_token_payload", JSON.stringify(payload));
  localStorage.setItem("user_id", payload.sub);

  // Redirect to intended page
  window.location.replace(state || "/");
}

// ── Logout ─────────────────────────────────────────────────────
function logout() {
  ["access_token", "id_token", "refresh_token", "expires_at",
   "id_token_payload", "user_id"].forEach(k => localStorage.removeItem(k));
  window.location.href = "/";
}
```

### Usage in a Route Guard (React Example)

```jsx
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    startLogin(window.location.pathname);
    return <div>Redirecting to login...</div>;
  }
  return children;
}
```

### Usage in an HTTP Interceptor (Axios Example)

```javascript
import axios from "axios";

const api = axios.create({ baseURL: "{KISAN_API_BASE_URL}" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("id_token");
  if (token) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);
```

---

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| "Missing PKCE code verifier" on callback | Verifier was cleared from storage (e.g., user opened callback in a different tab/browser) | Ensure the callback is opened in the same browser session that started the login |
| "State mismatch" error | CSRF protection triggered — state in callback doesn't match stored state | Don't modify the `state` value between redirect and callback |
| "Invalid code verifier" from token exchange | The code challenge sent during authorization doesn't match the SHA-256 hash of the verifier | Ensure you're using the same hashing (SHA-256, hex-encoded) and the same verifier instance |
| Token exchange returns error | Authorization code may have expired or been reused | Authorization codes are single-use and short-lived. Restart the login flow. |
| API returns 401 Unauthorized | Token has expired or is malformed | Check `expires_at` and re-authenticate if expired |
| Redirect loop on protected pages | Auth state not being checked correctly | Verify `isAuthenticated()` checks both token presence and expiry |
