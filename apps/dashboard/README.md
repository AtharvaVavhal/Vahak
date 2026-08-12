# Vahak Admin Dashboard

Next.js (App Router, TypeScript, Tailwind) dashboard consuming the `services/api` NestJS
backend. Admin-only — see the [root README](../../README.md) for the product overview.

## Requirements

- Node.js (LTS)
- The backend running locally: `services/api` on `PORT` from its `.env` (default `3000`)
- An ADMIN account. There is no admin self-registration endpoint — `POST /auth/register` only
  accepts `SENDER | CONDUCTOR | RECIPIENT` (verified live: role `"ADMIN"` → 400). Admin accounts
  are provisioned out of band (e.g. `services/api/seed-admin.ts` on `feat/backend`).

## Getting started

```bash
cd apps/dashboard
npm install
cp .env.example .env.local   # adjust NEXT_PUBLIC_API_URL for your machine
npm run dev
```

## Environment

Configuration is read from `NEXT_PUBLIC_*` variables (Next.js inlines these into the client
bundle at build time — see `src/constants/config.ts`). No secrets belong here.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of `services/api`, e.g. `http://localhost:3000` |

## Auth model

The backend issues the JWT in the `POST /auth/login` response body — there's no httpOnly
cookie session for this dashboard to lean on. The token is held in `localStorage`
(`src/auth/tokenStorage.ts`) so a page reload can restore the session, which is a real
XSS-exposure tradeoff relative to a cookie-based session; it's what the backend actually
supports today, not a production-grade pattern. Authorization is enforced by the backend on
every request regardless — the dashboard's admin-only gate (`DashboardShell`) is a UX
convenience, not a substitute for it.

## Backend API contract

Confirmed against `origin/feat/backend` (source) and live responses from the running API —
**not** the aspirational `/api/v1/*` endpoints in the root README.

- No global route prefix — routes are bare (`/auth/login`, not `/api/v1/auth/login`).
- Auth: `POST /auth/login` (`{phone, password}` → `{accessToken, user}`), `GET /auth/me`.
- Routes: full CRUD on `/routes`, `/routes/:id` — `ADMIN` for writes, `ADMIN`+`CONDUCTOR` for
  reads. `GET /routes` is paginated (`?page&limit` → `{data, meta}`) and includes nested
  `halts`/`buses`; the flat mutation endpoints don't.
- Halts: `/routes/:routeId/halts` (create/list), `/halts/:id` (read/update/delete). `sequence`
  must be a unique positive integer per route.
- Buses: `/routes/:routeId/buses` (create/list), `/buses/:id` (read/update/delete). `PATCH
  /buses/:id` is also the only way to toggle `active`.
- **`DELETE` on routes/halts/buses returns an empty response body** (verified live:
  `Content-Length: 0`) — the backend's `remove()` service methods `await` the Prisma delete
  without returning it, despite superficially reading as if they do. Typed as `Promise<void>`
  accordingly in `src/services/api/admin.ts`.
- Consignments: only `GET /consignments/:id` is usable from this dashboard. It has **no
  ownership check** — any authenticated role can look up any consignment by ID.

### Confirmed NOT to exist (verified live — all 404, not assumed)

- No admin-wide consignment listing/filtering endpoint. `GET /consignments` only ever returns
  the caller's own sender-owned records (always empty for an ADMIN account), and query params
  like `?status=` are silently ignored, not applied as a filter.
- No aggregate dashboard endpoint (`/dashboard/summary`, `/api/v1/dashboard/summary`).
- No incentives endpoint. The `IncentiveLedger` Prisma model exists but no controller exposes
  it, and no current service code writes to it either — it's schema-only.
- No user-management endpoint (`/users`) of any kind.
- No consignment event/timeline endpoint. `ConsignmentEvent` rows **are** created server-side
  on every state transition, but no API response (`findById`/`findMine`) ever includes them —
  the data exists in the database but isn't retrievable through the API.

### What this dashboard does instead of inventing endpoints

- **Dashboard overview** stats (route/halt/bus counts, active-bus split) are computed by paging
  through the real `GET /routes` response and summing client-side — not a mocked number, but
  also not a real aggregate endpoint. Consignment-related stats are explicitly omitted with a
  note explaining why, rather than shown as zero or fabricated.
- **Find Consignment** is ID-lookup only, matching the only endpoint that actually exists. Its
  detail view shows the current `status` prominently and does not render a fake timeline.

## Structure

```
src/
├── app/
│   ├── login/               # Login page (no registration — admin isn't self-registerable)
│   └── (admin)/              # Route group behind DashboardShell (auth + admin-role gate)
│       ├── dashboard/          # Overview
│       ├── routes/              # List, [id] detail (halts/buses managed inline via modals)
│       └── consignments/          # Find-by-ID lookup
├── auth/                    # AuthContext, localStorage token storage, session-expiry events
├── components/
│   ├── layout/                # Sidebar, Header, DashboardShell (auth/role guard)
│   ├── routes/                  # Route/Halt/Bus create-or-edit modal forms
│   └── ui/                        # Button, TextField, Modal, ConfirmDialog, etc.
├── constants/                # Env config, consignment status labels/colors
├── hooks/                     # useAuth
├── services/api/                # axios client + one module per backend resource
├── types/                        # Types mirroring backend DTOs/response shapes
└── utils/                         # ApiError, validation, formatting
```
