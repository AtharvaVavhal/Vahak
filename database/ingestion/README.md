# PMPML OpenStreetMap route ingestion (pilot)

**This imports community-derived OpenStreetMap PMPML route data. It is
NOT official PMPML data, and must never be described or displayed as
such.** OSM route relations are volunteer-mapped; they are openly licensed
(ODbL) and directly verifiable, but they are not sourced from PMPML's own
systems. Every imported row carries this distinction explicitly via
`dataSource = COMMUNITY_DERIVED`.

## What this imports

Exactly the **14 approved OSM relations** listed in `relations.ts`,
covering **9 PMPML route numbers**: 5, 81, 94, 100C, 114, 124, 208B, 256,
283. This list was hand-verified — each relation is tagged `type=route`,
`route=bus`, `operator=PMPML`, carries no `fixme` tag, and has real ordered
stop/platform members.

**Not imported, and not importable by this pilot without re-verification:**
- Any OSM relation outside the 14-ID allowlist, even if it superficially
  matches `operator=PMPML` — `osm-import.ts` checks every relation ID
  against the allowlist and rejects anything not on it.
- Route 100 — its only two OSM relations are a `stop_area` grouping
  relation (not a route) and a 1-member stub. No usable OSM data exists
  for it.
- Routes 77, 208, 43A — every OSM relation for these is `fixme`-flagged
  as incomplete.
- MSRTC data of any kind.
- PMC/OpenCity stop or route data (a separate, unjoined dataset — see the
  Milestone 1/2 research history for why it isn't combined with OSM here).
- Schedules, fares, fleet/bus registrations, real-time GPS — unavailable
  from any verified source for PMPML or MSRTC.

## Prerequisites

Same as `database/seed/`: a running PostgreSQL instance with migrations
applied, `npm install` run in `services/api/`, and the generated Prisma
client present (`npx prisma generate --schema=../../database/prisma/schema.prisma`
from `services/api/`).

## Running

```bash
# Inspect only — fetches, validates, and normalizes everything, writes nothing:
cd services/api
DRY_RUN=true npm run osm:ingest

# Real import (requires the explicit flag, same shape as ALLOW_QA_SEED):
ALLOW_REAL_DATA_INGEST=true npm run osm:ingest

# Remove everything this ingestion source created:
ALLOW_REAL_DATA_INGEST=true npm run osm:ingest:reset
```

Both scripts refuse to run if `NODE_ENV=production`, and the real
(non-dry-run) import additionally refuses without
`ALLOW_REAL_DATA_INGEST=true`. This is a deliberately distinct flag from
`ALLOW_QA_SEED` — the two systems are independent, and satisfying one must
never accidentally authorize the other.

## Why this doesn't reuse `RoutesService`/`HaltsService`

Those services' `create()` methods throw on duplicate name/sequence rather
than upserting, and have no parameter path for provenance fields. This
importer needs true idempotent upsert-by-`(provider, externalId)`
semantics, so it talks to `PrismaService` directly via native Prisma
`upsert()` — the same pattern `qa-reset.ts` already uses for its own
direct-Prisma access. Neither `routes.service.ts` nor `halts.service.ts`
is modified by this milestone.

## Identity and the multi-route-stop limitation

- **Route**: `provider="osm"`, `externalId=`the OSM relation ID (e.g.
  `"2891803"`), upserted on `(provider, externalId)`.
- **Halt**: `provider="osm"`, `externalId=`**`"<relationId>:<osmNodeId>"`**
  — a composite, not the bare OSM node ID.

The composite is required, not stylistic: **54% of the stop nodes across
the 14 approved relations are physically shared by more than one route**
(a busy junction is very often served by several bus lines). The current
Vahak schema requires every `Halt` to belong to exactly one `Route`
(`Halt.routeId` is a required scalar FK) — there is no `RouteStop` join
table. A bare-node-ID identity would mean the same Halt row gets
re-upserted once per route that touches that physical stop, and each
upsert would silently reassign its `routeId` to whichever route happened
to be processed last — corrupting previously-imported routes on every
re-run. Scoping the identity to `(relationId, nodeId)` instead creates one
Halt row per (route, physical-stop) pair, which is exactly what the
current schema is actually capable of representing. The raw OSM node ID
remains fully recoverable (it's the half after the colon), and
`sourceUrl` always points at the plain node permalink, not the composite.

**This is the "real transit stops serve multiple routes" limitation the
Milestone 2 architecture review flagged in advance — this pilot hit it
concretely, not hypothetically, and worked around it at the identity
level rather than by redesigning the schema.** A future GTFS-style
`Stop`/`RouteStop` redesign would let a physical stop be represented once
and referenced by many routes; that redesign is explicitly out of scope
here.

## Sequence

`Halt.sequence` is the 1-based position of each stop/platform **node**
member within the *filtered* member list — filtered down to PTv2 roles
(`stop`, `platform`, `stop_entry_only`, `stop_exit_only`,
`platform_entry_only`, `platform_exit_only`) and further restricted to
`type=node`. Raw OSM relations interleave way (geometry) members between
stops, so the raw member array index is never used directly — using it
would produce gaps wherever a way member sits between two stops.

Way-typed members carrying a stop/platform role are skipped entirely, not
approximated: no centroid is computed from the way's geometry, no
representative node is guessed. They are counted
(`skippedWayPlatformCount`) and reported in the import summary.

## Validation (fail-safe, not fail-open)

Every relation is fetched, fully validated, and normalized *before* any
database write is attempted for it. If validation fails for any reason,
that relation is rejected and reported — never partially written. Checks,
in order: on the approved allowlist; relation exists; `type=route`;
`route=bus`; `operator=PMPML`; has `name`/`from`/`to` tags; has ≥1 usable
node-typed stop member; no node repeated within one relation's own stop
sequence; every referenced node resolves (no dangling references); every
resolved node has plausible, non-zero coordinates within a generous
Maharashtra/Pune-metro bounding box; every resolved node has a non-empty
name. A batch-wide check additionally catches any duplicate
`(provider, externalId)` across the whole import run.

## Reset safety

`osm-reset.ts` deletes only rows matching **both**
`provider="osm"` and `dataSource="COMMUNITY_DERIVED"` — never a table-wide
delete, never anything QA-related (QA rows always have `provider=NULL`),
never any other future provider's rows. Before deleting any Route, it
checks whether any `Consignment` references it and **aborts with a clear
error** rather than deleting or attempting to bypass the database's own
foreign-key protection — this should never trigger under normal use since
this milestone never creates Bus or Consignment rows against OSM data,
but the check exists so a future mistake fails loudly instead of silently
corrupting or being silently blocked by an opaque Prisma error.

## What is deliberately NOT here

No `Bus` records are created — no verified real PMPML fleet/registration
data exists. No schedules, fares, or real-time GPS — unavailable from any
legitimate source found during research. No MSRTC data of any kind. No
PMC/OpenCity stop data, and no fuzzy geographic or name matching between
PMC and OSM.

## Production readiness — explicitly NOT claimed here

This pilot proves the ingestion mechanism works end-to-end against real,
verifiable OSM data. It does **not** constitute production approval.
Outstanding, unresolved, and out of scope for this milestone: **ODbL
attribution/share-alike compliance for storing and serving this data**,
which remains an open legal/product decision from the Milestone 2
architecture review — not something this code resolves by existing.
