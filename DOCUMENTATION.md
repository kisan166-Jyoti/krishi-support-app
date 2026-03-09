# Krishi Support App — Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Authentication — Kisan OAuth2 PKCE Flow](#5-authentication--kisan-oauth2-pkce-flow)
6. [Frontend (Angular)](#6-frontend-angular)
7. [Backend (Express)](#7-backend-express)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [Environment Configuration](#10-environment-configuration)
11. [Security](#11-security)

---

## 1. Project Overview

**Krishi Support** is a full-stack web application designed to provide Indian farmers with:

- **Crop advisories** — detailed guidance on diseases, pests, and crop management
- **Expert queries** — a form to submit questions directly to agricultural experts
- **Secure access** — login via the Kisan OAuth2 platform (PKCE flow), ensuring only authenticated farmers can access content

The app supports three crops (Wheat, Rice, Tomato) with 5 advisories each, covering disease, pest, and management categories.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19 (standalone components, `@for`/`@if` control flow) |
| Backend | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Authentication | Kisan OAuth2 — Authorization Code flow with PKCE (RFC 7636) |
| Styling | Custom CSS (green/earth theme — `#2d6a2d` primary, `#f4a012` amber) |

---

## 3. Project Structure

```
krishi-support-app/
│
├── backend/
│   ├── server.js                  # Express app entry point (port 5000)
│   ├── db.js                      # SQLite setup, table creation, seed data
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware (Kisan id_token)
│   └── routes/
│       ├── crops.js               # GET /api/crops, GET /api/crops/:id
│       ├── advisories.js          # GET /api/advisories, GET /api/advisories/:id
│       └── queries.js             # POST /api/queries (protected), GET /api/queries
│
├── frontend/
│   └── src/
│       ├── environments/
│       │   ├── environment.ts     # Dev config (Kisan OAuth placeholders + local URLs)
│       │   └── environment.prod.ts # Prod config
│       └── app/
│           ├── app.component.ts   # Root component (navbar + router-outlet + footer)
│           ├── app.config.ts      # Angular providers (router, HttpClient + authInterceptor)
│           ├── app.routes.ts      # Route definitions with authGuard
│           │
│           ├── core/
│           │   ├── models/
│           │   │   └── auth.models.ts        # KisanTokenPayload, KisanTokens, KisanProfile interfaces
│           │   ├── services/
│           │   │   ├── auth.service.ts       # PKCE flow, token storage, isAuthenticated, logout
│           │   │   ├── profile.service.ts    # Fetch & store Kisan user profile
│           │   │   ├── advisory.service.ts   # HTTP calls for advisories
│           │   │   ├── crop.service.ts       # HTTP calls for crops
│           │   │   └── query.service.ts      # HTTP call to submit expert query
│           │   ├── interceptors/
│           │   │   └── auth.interceptor.ts   # Attaches Authorization: {id_token} to all requests
│           │   └── guards/
│           │       └── auth.guard.ts         # Redirects unauthenticated users to /login
│           │
│           ├── pages/
│           │   ├── login/                    # Triggers PKCE login redirect
│           │   ├── auth-callback/            # Handles OAuth callback, exchanges code for tokens
│           │   ├── home/                     # Crop cards with advisory counts
│           │   ├── advisories/               # Filterable advisory list
│           │   ├── advisory-detail/          # Full advisory detail view
│           │   └── ask-expert/               # Expert query submission form
│           │
│           └── shared/components/
│               ├── navbar/                   # Navigation + user name + logout button
│               └── footer/                  # App footer
│
├── oauth-integration.md           # Kisan OAuth2 PKCE integration specification
└── DOCUMENTATION.md               # This file
```

---

## 4. Getting Started

### Prerequisites

- Node.js 18+
- Angular CLI (`npm install -g @angular/cli`)

### Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Configure Environment

Before running, open `frontend/src/environments/environment.ts` and replace the placeholders with credentials provided by the Kisan team:

```ts
kisanClientId:    'YOUR_KISAN_CLIENT_ID',
kisanOAuthUiUrl:  'YOUR_KISAN_OAUTH_UI_URL',
kisanOAuthApiUrl: 'YOUR_KISAN_OAUTH_API_URL',
kisanApiBaseUrl:  'YOUR_KISAN_API_BASE_URL',
```

### Run the App

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend && npm start

# Terminal 2 — Frontend (http://localhost:3000)
cd frontend && ng serve
```

Open **http://localhost:3000** in your browser. You will be redirected to the Kisan login page automatically.

---

## 5. Authentication — Kisan OAuth2 PKCE Flow

The app uses the **Authorization Code flow with PKCE** (RFC 7636). No client secret is needed. Here is the complete flow:

```
Browser (Angular App)            Kisan OAuth UI          Kisan OAuth API
        │                               │                       │
  1.    │── Generate code_verifier ─────┤                       │
        │   & code_challenge (SHA-256)  │                       │
        │                               │                       │
  2.    │── Redirect to OAuth UI ───────►                       │
        │   ?response_type=code         │                       │
        │   &client_id=...              │                       │
        │   &code_challenge=...         │                       │
        │   &state=/intended-route      │                       │
        │                               │                       │
        │                    User logs in (OTP/phone/email)     │
        │                               │                       │
  3.    ◄── Redirect back to /auth/callback ────────────────────│
        │   ?code=AUTH_CODE             │                       │
        │   &auth_progress_id=KEY       │                       │
        │   &state=/intended-route      │                       │
        │                               │                       │
  4.    │── Validate state (CSRF check) │                       │
        │                               │                       │
  5.    │────── POST /challenge/ ───────────────────────────────►
        │   { action, challenge_name,   │                       │
        │     auth_progress_id, code,   │                       │
        │     code_verifier }           │                       │
        │                               │                       │
  6.    ◄────── { access_token, id_token, refresh_token } ──────│
        │                               │                       │
  7.    │── Store tokens in localStorage│                       │
        │── Decode id_token → user_id   │                       │
        │── Fetch user profile          │                       │
        │── Navigate to /intended-route │                       │
```

### Key Implementation Files

| File | Role |
|------|------|
| `auth.service.ts` | `startLogin()` — generates PKCE pair, redirects to Kisan UI |
| `auth.service.ts` | `handleCallback()` — validates state, exchanges code for tokens |
| `auth.service.ts` | `storeTokens()` — saves all tokens + decoded payload to localStorage |
| `auth.service.ts` | `isAuthenticated()` — checks token presence and expiry |
| `auth.service.ts` | `logout()` — clears all auth keys, navigates to `/login` |
| `profile.service.ts` | `fetchProfile()` — calls `GET {kisanApiBaseUrl}/{userId}/profile` |
| `auth.interceptor.ts` | Attaches `Authorization: {id_token}` to every HTTP request |
| `auth.guard.ts` | Redirects unauthenticated users to `/login?redirect=<intended-url>` |
| `login.component.ts` | On init, immediately calls `startLogin(redirect)` |
| `auth-callback.component.ts` | On init, calls `handleCallback()` then `fetchProfile()` |

### PKCE Code Challenge

The code challenge is the **SHA-256 hash of the code verifier, hex-encoded**:

```ts
const hash = await crypto.subtle.digest('SHA-256', encodedVerifier);
const challenge = Array.from(new Uint8Array(hash))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');
```

### Token Storage (localStorage)

| Key | Value |
|-----|-------|
| `access_token` | Raw access token string |
| `id_token` | JWT — used in `Authorization` header for all API calls |
| `refresh_token` | Stored but not used (no refresh flow; re-authenticate on expiry) |
| `expires_at` | UNIX timestamp (seconds) when session expires |
| `id_token_payload` | JSON-decoded JWT payload `{ sub, exp, iat }` |
| `user_id` | `sub` claim from id_token — the farmer's unique ID |
| `kisan_profile` | Full profile JSON fetched from Kisan API after login |

### Temporary PKCE Storage (sessionStorage)

| Key | Value | Cleared |
|-----|-------|---------|
| `pkce_code_verifier` | 128-char random string | After successful token exchange |
| `oauth_state` | Intended redirect path | After successful token exchange |

---

## 6. Frontend (Angular)

### Routing

```
/                   → HomeComponent          [authGuard]
/advisories         → AdvisoriesComponent    [authGuard]
/advisories/:id     → AdvisoryDetailComponent [authGuard]
/ask-expert         → AskExpertComponent     [authGuard]
/login              → LoginComponent         (public)
/auth/callback      → AuthCallbackComponent  (public)
**                  → redirects to /
```

All routes except `/login` and `/auth/callback` are protected by `authGuard`. Unauthenticated users are redirected to `/login?redirect=<original-url>` and returned there after login.

### HTTP Interceptor

`authInterceptor` is registered globally in `app.config.ts`. It:
- Reads the `id_token` from localStorage via `AuthService.getToken()`
- Attaches `Authorization: <id_token>` to every outgoing HTTP request
- Skips the header for Kisan's token-exchange endpoint (`/challenge/`) since that call does not require authentication
- Listens for `401` responses and calls `authService.logout()` automatically

### Navbar

Shows only when the user is authenticated (`authService.currentUser$ | async`). Displays:
- The farmer's name from `profileService.currentProfile$` (falls back to "Farmer" if profile not loaded)
- Navigation links to Home, Advisories, Ask Expert
- A Logout button that clears profile + auth state and navigates to `/login`

### Pages

#### Home (`/`)
- Loads all crops and advisories in parallel using `forkJoin`
- Displays a card per crop with its icon, name, description, and advisory count
- "View Advisories" button navigates to `/advisories?cropId=<id>`

#### Advisories (`/advisories`)
- Lists all advisories, filterable by crop and type (disease / pest / management)
- Each card shows severity badge (high / medium / low), crop icon, title, and summary

#### Advisory Detail (`/advisories/:id`)
- Full detail view: symptoms, cause, solution, severity, date

#### Ask Expert (`/ask-expert`)
- Form fields: farmer name, crop (optional), question
- On submit, sends `POST /api/queries` with the `id_token` in the header (auto-attached by interceptor)
- The backend's `verifyToken` middleware validates the token before saving the query

---

## 7. Backend (Express)

**Entry point:** `backend/server.js` — runs on port `5000` (or `process.env.PORT`).

### Middleware

**`middleware/auth.js`** — `verifyToken`

Decodes the Kisan `id_token` JWT from the `Authorization` header and verifies expiry. Does not verify the signature (Kisan's public key is not available). Attaches the decoded payload to `req.user`.

Used on: `POST /api/queries`

### CORS

`cors()` with default settings — allows all origins. Suitable for local development. Restrict `origin` in production.

---

## 8. Database Schema

SQLite database stored at `backend/krishi.db`. WAL mode enabled for better performance.

### `crops`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `name` | TEXT | Crop name (e.g., Wheat) |
| `icon` | TEXT | Emoji icon |
| `description` | TEXT | Short description |

### `advisories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `crop_id` | INTEGER FK | References `crops.id` |
| `title` | TEXT | Advisory title |
| `type` | TEXT | `disease` \| `pest` \| `management` |
| `summary` | TEXT | Short overview |
| `symptoms` | TEXT | Observable symptoms |
| `cause` | TEXT | Root cause |
| `solution` | TEXT | Recommended treatment/action |
| `severity` | TEXT | `low` \| `medium` \| `high` |
| `created_at` | TEXT | Auto timestamp |

### `queries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `farmer_name` | TEXT | Submitted by (from form) |
| `crop_id` | INTEGER FK | Optional crop reference |
| `question` | TEXT | Farmer's question |
| `status` | TEXT | `pending` \| `answered` (default: `pending`) |
| `submitted_at` | TEXT | Auto timestamp |

### Seed Data

On first run, the database is seeded with:
- 3 crops: **Wheat**, **Rice**, **Tomato**
- 5 advisories per crop (15 total): 2 diseases, 2 pests, 1 management each

---

## 9. API Reference

Base URL (development): `http://localhost:5000/api`

### Health Check

```
GET /api/health
Response: { "status": "ok", "message": "Krishi Support API is running" }
```

### Crops

```
GET /api/crops
Response: [ { id, name, icon, description }, ... ]

GET /api/crops/:id
Response: { id, name, icon, description }
```

### Advisories

```
GET /api/advisories
Query params:
  cropId  (optional) — filter by crop ID
  type    (optional) — filter by "disease" | "pest" | "management"
Response: [ { id, crop_id, crop_name, crop_icon, title, type, summary,
              symptoms, cause, solution, severity, created_at }, ... ]

GET /api/advisories/:id
Response: { ...same fields as above... }
```

### Queries

```
POST /api/queries                          [requires Authorization header]
Body: { farmer_name, crop_id?, question }
Response (201): { id, farmer_name, crop_id, question, status, submitted_at }

GET /api/queries                           [public — for admin/verification]
Response: [ { ...query fields..., crop_name }, ... ]
```

### Authorization Header Format

Per the Kisan OAuth2 spec, the `id_token` is sent **without** a `Bearer` prefix:

```
Authorization: eyJhbGciOiJSUzI1NiIs...
```

---

## 10. Environment Configuration

### `frontend/src/environments/environment.ts` (Development)

```ts
export const environment = {
  production: false,

  // ── Kisan OAuth2 PKCE — replace with credentials from the Kisan team ──
  kisanClientId:    'YOUR_KISAN_CLIENT_ID',      // App's client ID
  kisanOAuthUiUrl:  'YOUR_KISAN_OAUTH_UI_URL',   // Kisan login page URL
  kisanOAuthApiUrl: 'YOUR_KISAN_OAUTH_API_URL',  // Token exchange API base URL
  kisanApiBaseUrl:  'YOUR_KISAN_API_BASE_URL',   // Kisan data API base URL
  callbackUrl:      'http://localhost:3000/auth/callback', // Angular dev server

  // ── Local backend ──
  apiBaseUrl: 'http://localhost:5000/api',
};
```

### `frontend/src/environments/environment.prod.ts` (Production)

All values must be replaced with production credentials and URLs before deploying.

---

## 11. Security

| Concern | Implementation |
|---------|---------------|
| CSRF protection | `state` parameter validated in callback against `sessionStorage` value |
| PKCE | Code verifier never sent in the initial redirect; only exchanged server-side |
| Token storage | Tokens stored in `localStorage`; cleared on logout |
| PKCE verifier | Stored in `sessionStorage` (tab-scoped); deleted immediately after exchange |
| Token expiry | `isAuthenticated()` checks `expires_at` — expired tokens treated as logged-out |
| 401 handling | Interceptor auto-logs out the user on any `401` response |
| Backend auth | `verifyToken` middleware decodes and validates expiry of the Kisan `id_token` |
| No token refresh | On expiry, user re-authenticates via the full PKCE flow (per Kisan spec) |
| HTTPS | Use HTTPS for callback URL and all API calls in production |
