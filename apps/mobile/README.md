# Vahak Mobile

React Native app (Expo + TypeScript) consuming the `services/api` NestJS backend. Single codebase, role-based navigation (sender / conductor / recipient / admin) — see the [root README](../../README.md) for the product overview.

## Requirements

- Node.js (LTS)
- Xcode (full install, not just Command Line Tools) + an iOS Simulator, for iOS development on macOS
- The backend running locally: `services/api` on `PORT` from its `.env` (default `3000`)

## Getting started

```bash
cd apps/mobile
npm install
cp .env.example .env   # adjust EXPO_PUBLIC_API_URL for your machine, see comments in the file
npm run ios             # or: npm start, then press i
```

## Environment

Configuration is read from `EXPO_PUBLIC_*` variables (Expo inlines these at build time — see `src/constants/config.ts`). No secrets belong here; the backend's `JWT_SECRET` etc. stay server-side.

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of `services/api`, e.g. `http://localhost:3000` |

## Structure

```
src/
├── auth/          # AuthContext/AuthProvider, secure token storage (expo-secure-store)
├── components/     # Shared UI primitives
├── constants/       # Env config, theme
├── hooks/            # useAuth, etc.
├── navigation/         # React Navigation stack(s)
├── screens/             # Screen components
├── services/api/         # axios client + one module per backend resource
├── types/                  # Types mirroring backend DTOs/response shapes
└── utils/                    # ApiError and other helpers
```

## Backend API contract

Confirmed against `origin/feat/backend` (source) and live responses from the running API — not the aspirational endpoint list in the root README:

- **No global route prefix.** `main.ts` never calls `setGlobalPrefix`, so routes are bare (`/auth/login`), not `/api/v1/auth/login`. Verify against source before assuming otherwise if that changes.
- Auth: `POST /auth/register` (`{ name, phone (10 digits), email?, password (min 8 chars), role? }`, `role` ∈ `SENDER | CONDUCTOR | RECIPIENT` — `ADMIN` isn't self-registerable), `POST /auth/login` (`{ phone, password }`), both returning `{ accessToken, user }`; `GET /auth/me` returns the same `user` shape.
- Consignments (`src/services/api/consignments.ts`): `POST /consignments` (SENDER), `POST /consignments/:id/book` and `/cancel` (SENDER, owner-only), `POST /consignments/:id/accept` and `/handover` (CONDUCTOR), `POST /consignments/:id/handover/verify` (RECIPIENT, owner-only — the handover PIN is backend-generated and never persisted or hashed on-device), `GET /consignments` (own, sender-filtered) and `GET /consignments/:id` (no ownership check — any authenticated user).
- Admin (`src/services/api/admin.ts`): full CRUD on `/routes`, `/routes/:routeId/halts` + `/halts/:id`, `/routes/:routeId/buses` + `/buses/:id` — ADMIN for writes, ADMIN+CONDUCTOR for reads. `DELETE` responses are empty bodies (verified live — the backend's `remove()` methods don't return the deleted record despite superficially appearing to).
- `GET /health` — `{ status, database }`.
- Errors are a consistent envelope from the global exception filter: `{ statusCode, message, path, timestamp }` — handled centrally in `src/services/api/client.ts` and surfaced as `ApiError`. A `401` from any endpoint other than `/auth/login`/`/auth/register` forces logout via `src/auth/sessionEvents.ts`.

**Known backend limitations** (not mobile bugs — no matching endpoint exists): there's no sender-safe route/halt/bus/recipient lookup, no conductor-scoped consignment queue, no recipient-scoped delivery list, no admin-wide consignment listing, and no user-management API at all. Every role's "find a consignment" screen works by direct ID entry as a result — see each screen's helper text.
