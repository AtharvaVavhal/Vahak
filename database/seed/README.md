# QA seed data

Deterministic, repeatable fixtures for local/development testing of the
Vahak backend. **Development/test data only — never run this against a
production database.**

## What this is (and isn't)

This replaces the earlier `feat/data-qa` prototype's static `data/seed/*.json`
files, which had no runner script, used the wrong hashing algorithm for
`DeliveryProof.codeHash` (bcrypt instead of the sha256 the backend actually
uses), and recorded no plaintext passwords anywhere. `qa-seed.ts` avoids all
of that by driving every user and consignment through the real
`AuthService` / `ConsignmentsService` methods, so the data it produces is
byte-for-byte what the running app itself would create.

## Prerequisites

- A running PostgreSQL instance with migrations applied
  (`npx prisma migrate deploy` from `database/`, or `migrate dev` in local development).
- `npm install` run in `services/api/` (and at the repo root, for the
  workspace-hoisted `bcrypt`/`@nestjs/jwt` deps).
- `npx prisma generate --schema=../../database/prisma/schema.prisma` run
  from `services/api/` (produces the gitignored generated client these
  scripts import).

## Required environment variables

Set in the repo-root `.env` (loaded automatically by both scripts):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Same connection string the API itself uses |
| `ALLOW_QA_SEED` | yes | Must be exactly `true`; both scripts refuse to run otherwise |
| `NODE_ENV` | — | Both scripts refuse to run if this is `production` |
| `QA_SEED_PASSWORD` | no | Password for the SENDER/CONDUCTOR/RECIPIENT QA users. Defaults to `QaSeed@2026` if unset (same "env var with a committed dev-only fallback" pattern already used by `services/api/seed-admin.ts`) |
| `QA_SEED_ADMIN_PASSWORD` | no | Password for the QA admin user. Defaults to `QA_SEED_PASSWORD` if unset |

## Running the seed

```bash
cd services/api
ALLOW_QA_SEED=true npm run qa:seed
```

`qa:seed`/`qa:reset` compile this directory (and the backend modules they
import) with `tsc` before running the compiled output with plain `node`.
This is deliberate, not incidental: the generated Prisma client uses
`moduleResolution: nodenext`-style `.js`-suffixed relative imports that
resolve correctly once compiled, but plain `ts-node` execution cannot
resolve them at runtime. `dist/` here is a build artifact — already covered
by the repo's `dist/` gitignore rule — not something to commit.

The script prints a credential summary (phone/email/plaintext password for
every QA user) and a lifecycle summary (tracking code, status, and — for
every `IN_TRANSIT` fixture — the plaintext handover PIN) to the terminal at
the end of the run. **Nothing here is written to a committed file** — read
it from the terminal output each time you seed.

## Resetting QA data

```bash
cd services/api
ALLOW_QA_SEED=true npm run qa:reset
```

Deletes only rows scoped to the fixed QA phone numbers, the QA route name,
and the QA bus registration defined in `fixtures.ts` — in FK-safe order
(delivery proofs → consignment events → incentive ledger → consignments →
bus → halts → route → users). It never truncates a table and never touches
unrelated development data sitting in the same database.

## Idempotency

Users, the route, halts, and the bus are upserted by their natural unique
keys (phone, route name, `(routeId, sequence)`, registration) — re-running
`qa:seed` after a successful run reuses them rather than duplicating them.

Consignments are the one exception: the real `ConsignmentsService.create()`
generates `trackingCode` server-side from a timestamp + random suffix, with
no way to pass in a predetermined value, so individual consignments can't be
checked for prior existence. Instead, `qa:seed` checks whether the QA sender
already has *any* consignments and skips the entire lifecycle-fixture batch
if so, printing a notice to run `qa:reset` first. This keeps re-runs safe
(never silently duplicating fixtures) without fabricating a tracking-code
convention the real service doesn't support.

## QA users

| Role | Phone | Email | Password |
|---|---|---|---|
| ADMIN | 9555000001 | qa.admin@vahak.qa | `QA_SEED_ADMIN_PASSWORD` (see above) |
| SENDER | 9555000002 | qa.sender@vahak.qa | `QA_SEED_PASSWORD` |
| CONDUCTOR | 9555000003 | qa.conductor@vahak.qa | `QA_SEED_PASSWORD` |
| RECIPIENT | 9555000004 | qa.recipient@vahak.qa | `QA_SEED_PASSWORD` |
| SENDER (unrelated) | 9555000005 | qa.unrelated.sender@vahak.qa | `QA_SEED_PASSWORD` |
| CONDUCTOR (unrelated) | 9555000006 | qa.unrelated.conductor@vahak.qa | `QA_SEED_PASSWORD` |
| RECIPIENT (unrelated) | 9555000007 | qa.unrelated.recipient@vahak.qa | `QA_SEED_PASSWORD` |

The three "unrelated" users exist solely so authorization checks (an
unrelated sender/recipient/conductor must be refused access to another
user's consignment) have a fixed, reproducible counterparty instead of
depending on incidental data already sitting in the dev database.

Passwords are hashed with `bcrypt.hash(password, 12)` — the exact algorithm
and cost factor `AuthService`/`seed-admin.ts` already use.

## Route / halts / bus

- Route: **QA Demo Route** (QA Origin Halt → QA Destination Halt)
- Halts: QA Halt A - Origin (1) → QA Halt B - Midpoint (2) → QA Halt C - Destination (3)
- Bus: **QA-BUS-0001**, active, assigned to the QA route

## Consignment lifecycle fixtures

Each is created via `ConsignmentsService.create()` and then driven through
the real transition methods (`book` / `accept` / `initiateHandover` /
`verifyHandover` / `cancel`) — never by writing a `status` or event row
directly:

| Fixture | Final status | Notes |
|---|---|---|
| `created` | `CREATED` | |
| `booked` | `BOOKED` | |
| `accepted` | `ACCEPTED` | |
| `inTransitActive` | `IN_TRANSIT` | Valid, unverified handover PIN — printed in seed output for manual QA of `POST /consignments/:id/handover/verify` |
| `delivered` | `DELIVERED` | Full happy path; PIN generated and verified during seeding |
| `cancelled` | `CANCELLED` | Cancelled from `CREATED` |
| `inTransitExpiredPin` | `IN_TRANSIT` | PIN generated normally, then `DeliveryProof.expiresAt` backdated — verify should fail with "Handover PIN has expired" |
| `inTransitMaxAttempts` | `IN_TRANSIT` | PIN generated normally, then `DeliveryProof.attempts` set to 5 — verify should fail with "Maximum PIN verification attempts exceeded" |

`IncentiveLedger` is intentionally **not** seeded: no service in the current
backend reads or writes that table yet, so seeding it would populate a
feature that doesn't functionally exist. Add fixtures here once that
service logic lands.

## Where generated PINs appear

Only in the terminal output of `qa:seed`, printed once at the end of each
run. They are never written to a file in this repository.
