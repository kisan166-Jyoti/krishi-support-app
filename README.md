# Krishi Support App

A full-stack farming advisory platform that helps farmers access crop disease, pest, and management advisories, and submit questions to experts.

## Stack

- **Backend** — Node.js + Express + better-sqlite3, JWT auth (bcryptjs + jsonwebtoken)
- **Frontend** — Angular 19 (standalone components, functional guards & interceptors)

## Features

- Browse advisories by crop and type (disease / pest / management)
- Submit questions to experts (requires login)
- JWT-based authentication — register, login, auto-logout on token expiry
- Session persists in `sessionStorage` (cleared on tab close)

## Project Structure

```
krishi-support-app/
├── backend/
│   ├── server.js               # Express app (port 5000)
│   ├── db.js                   # SQLite setup + seed data
│   ├── middleware/auth.js      # JWT verifyToken middleware
│   └── routes/
│       ├── auth.js             # POST /api/auth/register & /login
│       ├── crops.js            # GET /api/crops
│       ├── advisories.js       # GET /api/advisories
│       └── queries.js          # GET|POST /api/queries
└── frontend/
    └── src/app/
        ├── core/
        │   ├── services/       # auth, crop, advisory, query services
        │   ├── interceptors/   # auth interceptor (Bearer token injection)
        │   └── guards/         # authGuard (redirects to /login)
        ├── pages/              # home, advisories, advisory-detail, ask-expert, login, register
        └── shared/components/  # navbar, footer
```

## Getting Started

### Prerequisites

- Node.js 18+
- Angular CLI (`npm install -g @angular/cli`)

### Backend

```bash
cd backend
npm install
node server.js
# API runs at http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
ng serve
# App runs at http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/crops` | No | List all crops |
| GET | `/api/advisories` | No | List advisories (filter by `cropId`, `type`) |
| GET | `/api/advisories/:id` | No | Advisory detail |
| POST | `/api/queries` | Yes | Submit expert question |
| GET | `/api/queries` | No | List submitted queries |

## Seed Data

3 crops pre-loaded with 5 advisories each:

| Crop | Advisories |
|------|-----------|
| Wheat | Yellow Rust, Loose Smut, Aphids, Termites, Irrigation |
| Rice | Blast, Bacterial Leaf Blight, Brown Planthopper, Stem Borer, Water Management |
| Tomato | Early Blight, Leaf Curl Virus, Fruit Borer, Whitefly, Nutrition Guide |
