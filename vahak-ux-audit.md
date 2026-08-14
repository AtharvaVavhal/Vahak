*(moved to outputs — see delivered file)*

Grounded in the actual codebase (`apps/mobile`, `apps/dashboard`, `services/api`, `database/prisma/schema.prisma`) as of this review. No backend, database, or API changes are proposed. Where a UX gap traces back to a missing endpoint or field, it's labeled **"UX issue caused by existing backend constraint."**

No reference screenshot was attached to this conversation — the design direction below is built from your written brief (restrained, premium, fintech-adjacent logistics feel) rather than an image. Send the screenshot if you still want it factored in before we lock the visual system.

---

## 1. UX Diagnosis

**What it currently feels like:** a working CRUD scaffold, not a product. Every role's home screen is the same template — greeting, two navigation cards, a logout button. Nothing tells a user what needs their attention. A conductor with three parcels to hand over today sees the same screen as a conductor with zero. This is the single biggest issue in the app: **the home screen is a menu, not a dashboard.**

**Confusing:**
- Two ways to find a consignment exist on every role (a list screen + a "Find a consignment" ID-lookup screen), presented as equal-weight cards. The ID-lookup screen only makes sense as a support/edge-case tool (someone reads a tracking code over the phone), but it's visually as prominent as the primary list.
- Status colors don't distinguish `BOOKED` from `ACCEPTED` — both render identical blue badges (`CONSIGNMENT_STATUS_COLORS` in mobile, `CONSIGNMENT_STATUS_CLASSES` in dashboard). A sender glancing at their list can't tell "still waiting for a conductor" from "a conductor has it" without reading the text label.
- `IN_TRANSIT` is set the moment the conductor starts the handover PIN flow — i.e., right as the parcel is *arriving* at the recipient, not while it's actually riding the bus between halts (`consignments.service.ts`, `initiateHandover`). For the entire period the parcel is physically moving — accepted, loaded, riding through halts — the status sits at `ACCEPTED` with no signal of progress. Users will read "In transit" and reasonably assume the bus just left, when it actually means the opposite: it's basically arrived. This is a copy/labeling problem we can fix without touching the backend, but it needs a deliberate fix, not inherited default text.
- The handover PIN is shown to the conductor exactly once, with no resend or regenerate action anywhere in the API (`ConsignmentsController` has no such route). If the conductor fat-fingers a note, loses signal, or the recipient doesn't get the PIN in time, there is currently no recovery path in the product at all. **UX issue caused by existing backend constraint** — flag this as a P0 conversation to have about the backend, but for the UI we at least need to design the failure state honestly instead of pretending it can't happen.

**Feels unfinished:**
- Every screen re-declares its own `StyleSheet`/Tailwind classes from scratch. The "section card," "workflow dots," and "info row" patterns are copy-pasted near-verbatim across 6+ screens per platform instead of shared components. Functionally fine, visually it reads as a prototype because nothing is systematized.
- Zero icons anywhere in either app — no icon library is even installed (`package.json` has no `lucide-react`, `expo-vector-icons`, etc.). Every status, every action, every piece of state is communicated through color and text alone. For a transportation product this is a missed trust signal — logistics products lean on iconography (route lines, pins, truck/bus glyphs, verified checkmarks) specifically because it lets an operator scan in under a second.
- The admin dashboard's "Overview" page is four counts about routes/halts/buses. There is no consignment volume, no pending actions, nothing operational. This isn't a design failure — the code is honest about why (`computeStats()` comment: "the backend has no aggregate dashboard endpoint... verified live: GET /dashboard/summary... 404") — but the current UI doesn't make that limitation feel intentional. It reads as broken rather than "here's what we can honestly show you today."

**Where users will hesitate:**
- Sender booking: the "Recipient ID" field is a raw UUID text box (`BookParcelScreen`). No sender will have this memorized. **UX issue caused by existing backend constraint** — there is no user-search/lookup endpoint in the API (`services/api/src` has no users controller). Same for the optional "Bus ID" field, which additionally asks a sender to know operational bus assignments they have no way of looking up. This is the single most likely point of task abandonment in the entire product.
- Booking shows "Fare: Determined by the server after booking" during the review step (`BookParcelScreen`, `InfoRow label="Fare"`). The user commits to "Confirm booking" without knowing the price. This is a pure sequencing bug, not a backend gap: fare is currently a fixed flat constant (`fare.ts`'s `DEMO_FLAT_FARE = 100`, explicitly documented in the code as a demo placeholder, not distance/size-based pricing) — it's knowable client-side today with zero API calls, so there's no reason to hide it until after commit.
- Conductor "Accept" and "Start handover" are irreversible-feeling one-tap actions with no confirmation step, while the much lower-stakes "Log out" button gets equal visual weight to primary actions on every home screen.

**Information hierarchy:** every detail screen (sender/conductor/recipient/admin) is the same stacked list of bordered cards — Parcel, Route, Sender, Recipient, Timeline — in the same order regardless of role or status. A recipient looking at a `DELIVERED` consignment sees the exact same layout as a conductor looking at one that's `BOOKED` and needs action. Nothing is status-aware. The single most important question — "what do I need to do right now, if anything" — is answered by scanning a wall of read-only rows to find a conditionally-rendered button or notice string at the bottom.

**Navigation:** there is no tab bar, no drawer, no persistent chrome of any kind — every role is a single `createNativeStackNavigator` stack. "Home" functions as the only hub; every other screen is a dead end you back out of. This is workable for an app this small today, but it means there's no cheap way to jump from "looking at a consignment" to "my consignment list" without a full pop-to-top. Fine for now, worth fixing in the IA section below.

---

## 2. Role-by-Role UX Strategy

### Sender
Primary action: **book a parcel.** Secondary: check status of what's already sent. The home screen should lead with a single unmistakable CTA ("Send a parcel") plus a compact status summary of active consignments ("2 in transit, 1 awaiting pickup") — not a second equal-weight card that requires a tap-through to see anything. Most important information on any sender screen: current status, in plain language, and what happens next — not fare, not parcel size, not description. Those are supporting details.

Booking flow should read as one continuous decision, not four disconnected screens: pick a route → pick pickup/dropoff → tell us about the parcel and who it's for → confirm with a real price → done. The recipient step is the weakest link today (raw UUID entry) — see the Booking UX section for the mitigation available without backend changes.

Tracking: a sender should be able to see, at a glance and without opening the detail screen, which of their active consignments need nothing from them versus which are stuck (e.g. `CREATED` and never got booked — this state exists in the code as a real recoverable failure, `BookingConfirmationScreen`'s `needsBookingRetry`).

### Conductor
This is a field tool used standing up, possibly one-handed, between stops. It needs to answer one question the instant it opens: **what do I need to do right now?** Not "browse consignments" — a prioritized queue. Today `AvailableConsignmentsScreen` already does the right grouping server-independent of design (Available to accept vs. My deliveries) — that's the correct information architecture, it just needs to be the *first* thing the conductor sees, not a card they tap into from a generic home screen.

Accepting a consignment should stay a single tap (it already is) but should show route/halt context in the confirmation, since a conductor may be looking at consignments for routes that aren't theirs. Handover is the highest-stakes moment in the whole app: the PIN card should be impossible to miss, should make "copy" and "share" trivial, and should be honest that it's a one-time reveal — the current text notice ("it will not be shown again") is correct but easy to skim past given it's styled like every other card. This deserves a modal/full-attention treatment, not an inline card among five other inline cards.

### Recipient
Primary action is almost always **nothing** until a PIN needs entering — this role spends most of its time waiting. The home/list screen should make waiting legible: where is my parcel in the process, and will I be notified when it's my turn to act. The one moment recipients truly act — PIN verification — is already well-scoped in the code (6-digit numeric input, clears on failure) and just needs weight and reassurance: large touch targets, a visible attempts/expiry state (the schema tracks `attempts` and `expiresAt` on `DeliveryProof` — currently invisible to the user), and a delivery confirmation that feels conclusive (proof, timestamp, done) rather than a generic "Delivered" text screen.

### Admin
Today's admin surface (both mobile and dashboard) is genuinely two capabilities: manage the route network (routes/halts/buses — full CRUD, works well) and look up one consignment by ID (a compensating pattern for a missing list endpoint). The dashboard should be honest about this split rather than pretending to be a full ops console. Overview should prioritize what's actually knowable today — network health (routes, active buses, halt coverage) — and treat "consignment search" as its own clearly-scoped tool, not imply there's a missing "volume" chart nearby. **UX issue caused by existing backend constraint**: no admin-wide consignment list, no aggregate stats endpoint, and no exposed event history (`ConsignmentEvent` rows are written but never returned by any API response — confirmed in the dashboard's own code comment). Until one of those exists, "search by ID" is the ceiling of what the UI can honestly offer for consignment oversight — design should make that single tool excellent rather than dress up empty dashboard chrome around it.

---

## 3. Information Architecture

**Mobile.** Keep per-role stacks (they map cleanly to four genuinely different jobs), but give each a real hub instead of a card-launcher. No tab bar is needed for sender/recipient (2–3 destinations each, used in short bursts) — a single home screen that *is* the list (status-first) with a floating/primary CTA is enough, eliminating one tap from the most common path. Conductor benefits from a lightweight two-tab pattern (**Queue** / **Find**) since it's used continuously during a shift, not opened for one task and closed. Admin mobile should probably shrink, not grow — route/halt/bus management belongs on the dashboard where tables and forms are easier to use with a keyboard and mouse; the mobile admin surface can stay a lightweight "search + view" companion.

Primary CTA per role: Sender → "Send a parcel." Conductor → the queue itself (no CTA needed, the list *is* the action surface). Recipient → none by default; PIN entry surfaces contextually on the one delivery that needs it. Admin → "Find consignment" stays secondary to route management, not co-equal.

**Dashboard.** Three sections is roughly right for what the backend currently exposes — don't manufacture a fourth. Rename "Overview" to reflect what it actually shows (network health, not "everything"), and keep "Find a consignment" as its own nav item rather than folding it into a fake "Consignments" section that implies a list exists. When/if a real consignment-list endpoint exists, that's the natural point to add a proper "Consignments" section with filters — not before.

---

## 4. Screen-by-Screen Redesign

*(Focused on the screens you called out. Each entry: purpose, primary CTA, hierarchy, states.)*

**Login** — Purpose: get an existing user in fast. Primary CTA: Log in. The current phone+password form is fine functionally; visually it needs a real brand moment (wordmark, a single strong accent, maybe a subtle route-line motif) instead of centered form-on-white, which currently looks identical to a generic tutorial auth screen. Error state (`ErrorBanner`) is already handled inline — keep that, just restyle. Loading: button spinner only (already correct, no full-screen blocking). Success: existing role-based redirect, keep.

**Register** — Purpose: get a new user in, correctly scoped to a role. Primary CTA: Create account. The role selector (`RoleSelector`) choosing SENDER/CONDUCTOR/RECIPIENT at signup is a real decision users may not understand the implications of — needs a one-line description per role inline, not just a label. Same visual treatment as Login for consistency.

**Sender booking (multi-step: routes → halts → parcel form → confirmation)** — Purpose: get a parcel booked with minimum friction. Today's four-screen flow is roughly the right shape; needs (a) a persistent step indicator so the user knows how much is left, (b) the fare shown before the final confirm tap, not after, (c) recipient selection redesigned per the Booking UX section below. Empty state (no routes available) is already handled with a clear message + pull-to-refresh. Error state on submit already preserves the created-but-not-booked consignment and offers retry — good backend-aware design, needs a UI treatment that doesn't look like a dead-end warning (currently a small amber text line).

**Consignment tracking (sender/recipient/admin detail screens)** — see dedicated Tracking UX section below.

**Conductor consignment acceptance** — Purpose: decide whether to take this parcel. Primary CTA: Accept. Needs route/halt/fare visible above the fold before the tap, plus a lightweight confirmation (not a blocking modal — a single "Accepted" toast/state change is enough, this isn't a destructive action). Already correctly disables Accept once another conductor has claimed it, with a clear notice — keep that pattern, just restyle it from a plain gray text line to something with more visual weight (this is important status information, not a footnote).

**Conductor handover** — Purpose: safely transfer the parcel and generate proof. Primary CTA: Start handover → then the PIN reveal is effectively its own full-attention state. Treat the PIN reveal as a distinct, elevated moment (large numerals, explicit "share this now" instruction, expiry countdown) rather than one card among many. This is the highest-trust moment in the product and should look like it.

**Recipient delivery tracking** — Purpose: know when it's time to act. Primary CTA: none until `IN_TRANSIT`, then "Enter handover PIN." Status-specific notices already exist in code per state (nice — keep and elevate visually) — "waiting for a conductor," "conductor hasn't started handover yet," etc. These are good, human copy; they just need to look like status, not like disabled-state fine print.

**PIN verification** — Purpose: prove the recipient is who they say they are and close out the delivery. Primary CTA: Verify. Needs a visible expiry indicator (backend tracks `expiresAt` and `attempts` on `DeliveryProof`, currently unused by the UI) so a recipient isn't surprised by an "expired" error with no warning. Error states to design explicitly (see UX States section): wrong PIN, expired PIN, already delivered, too many attempts.

**Admin consignment search (mobile + dashboard)** — Purpose: locate one consignment by ID, fast. Primary CTA: Look up. This should stay a focused, single-purpose tool — resist the urge to bolt extra chrome onto it to make it *feel* like a bigger feature than it is. The dashboard's honest disclosure text ("no admin-wide listing exists") is good instinct, but reads apologetic; reframe as a clear tool description instead of an explanation of a missing feature.

**Admin dashboard (Overview)** — Purpose: network health snapshot. Primary content: route/halt/bus counts (real data, keep), reframed as "Network" rather than "Overview" implying it's the whole picture. Don't add a placeholder consignment-metrics card that explains what's missing — that draws attention to the gap. Instead, size the page to what's actually there and let "Find a consignment" be a clear, separate, first-class tool in the nav.

---

## 5. Design System

**Color.** Keep a restrained palette — the current instinct (one primary blue, neutral grays, semantic success/warning/danger) is directionally correct and shouldn't be replaced with something busier. What it needs: a distinct fourth state color so `BOOKED` and `ACCEPTED` stop sharing blue, a proper dark-mode-ready neutral scale (currently 3 grays total), and one deliberate "transportation" accent — a deep navy or slate-blue as the anchor brand color instead of a generic Tailwind `blue-600`/`#1D4ED8`, which currently reads as default rather than chosen.

**Typography.** No type scale exists today — font sizes are picked ad hoc per screen (13, 14, 15, 17, 24, 28...). Define one scale (e.g. display/title/heading/body/caption, 6 steps) and a single weight rhythm (regular/medium/bold — drop the in-between 600/700 inconsistency). A tabular/monospace treatment for tracking codes and PINs (already used inconsistently — `BookingConfirmationScreen` uses `Platform.select({ios:'Courier',...})`, other screens don't) should be standardized everywhere a code or PIN appears — it reinforces "this is a verifiable system code," which matters for trust.

**Spacing & radius.** The existing 4/8/16/24/32 scale and 12px card radius / 8px control radius are sane and consistent enough to keep as the foundation — don't reinvent this, just apply it uniformly (several screens hardcode raw numbers instead of the tokens).

**Cards.** Current pattern (1px border, subtle surface fill, 12px radius) is clean and appropriately restrained — keep it, but make it status-aware: a card representing an in-progress consignment should look different from one that's delivered or cancelled (currently identical borders/surface regardless of status, with only the small badge carrying that signal).

**Buttons.** Dashboard already has a real variant system (primary/secondary/danger/ghost) — mobile has only one (`Button` is always solid primary, including for "Log out," which shouldn't have the same visual weight as "Confirm booking"). Port the dashboard's variant model to mobile.

**Inputs, chips, status badges.** Functionally solid, visually flat. Status badges need the fourth color plus, ideally, a small icon per state (see Status Design). Chips (parcel size selector, pickup/dropoff halt selector) work well as a pattern — reuse this chip component more broadly instead of redefining "selectable pill" styling per screen.

**Icons.** Adopt one icon set (Lucide is already available as a dependency option and pairs well with this kind of minimal system) and use it deliberately: status icons, a route/bus glyph for transit context, a shield/check for verification moments. This is the highest-leverage visual change available — it's the fastest way to make the product look built rather than scaffolded.

**Navigation, sheets, modals, toasts.** None of these exist as real components today (`Alert.alert` native dialogs are used for destructive confirmations, which is fine and can stay for now). Introduce a bottom-sheet pattern for the conductor's PIN reveal and any future multi-field forms — it's a better fit for one-handed field use than full-screen pushes for lightweight actions.

**Loading & skeletons.** Currently a single centered `ActivityIndicator`/spinner everywhere. That's an acceptable P2 — skeleton screens are polish, not correctness, given how fast these lists load in practice. Fine to defer.

---

## 6. Status Design

Six real states exist in the schema (`ConsignmentStatus`): `CREATED, BOOKED, ACCEPTED, IN_TRANSIT, DELIVERED, CANCELLED`. `HANDOVER_INITIATED` / `HANDOVER_VERIFIED` are `ConsignmentEvent` types, not statuses — they happen *within* `IN_TRANSIT` and are currently invisible to any client (events aren't returned by the API). Design for the six real statuses; don't invent UI for sub-states the backend can't currently surface.

| Status | Meaning to communicate | Color | Icon idea |
|---|---|---|---|
| CREATED | Booking started, not yet confirmed | Neutral gray | Draft/pencil |
| BOOKED | Confirmed, waiting for a conductor | Blue | Clock |
| ACCEPTED | A conductor has it, parcel is moving | **New distinct color** (e.g. indigo/teal) — must not equal BOOKED's blue | Bus/route |
| IN_TRANSIT | Handover to recipient in progress | Amber | Handshake/PIN |
| DELIVERED | Confirmed received | Green | Check-shield |
| CANCELLED | Terminal, no further action | Red (muted) | X-circle |

Label copy should be rewritten around what the *user* needs to know, not the enum name: `ACCEPTED` → "Your parcel is with the conductor" reads better to a sender than "Accepted by conductor" (which is already close — good instinct in the current copy, just needs the tense/perspective made consistent per role). `IN_TRANSIT` specifically needs role-aware copy given the naming confusion diagnosed above — for a recipient it should read as "Ready for you to collect / verify," not "In transit," since that's the moment they act.

Progress indicator: the existing 5-dot workflow strip (`CONSIGNMENT_STATUS_WORKFLOW`, excluding `CANCELLED` as a branch) is the right shape — a linear progress track, not a graph — keep it, just give it the new color per step and connect the dots with a filled line rather than isolated circles, which will read more like a transit line (on-brand for a bus-route product) than a generic form-wizard stepper.

Timeline: cannot be built as a true timestamped event log today — **UX issue caused by existing backend constraint** (`ConsignmentEvent` exists in the schema and is written on every transition, but no endpoint returns it). Until that's exposed, the "timeline" is the status stepper plus `createdAt`/`updatedAt` — present that as a clean current-state view, not a fake activity feed. Flag this as the top candidate if you're open to *any* backend addition later: a `GET /consignments/:id/events` endpoint would unlock the single most valuable trust-building UI in the whole product (a real audit trail: who did what, when) for very low backend cost, since the data is already being written.

---

## 7. Tracking Experience

**Above the fold:** tracking code, current status (in plain language, not the enum), the progress stepper, and — for `ACCEPTED`/`IN_TRANSIT` — who has it right now (conductor name/phone) and where it's headed (dropoff halt). This is the "where is it / what's next / who's responsible" answer and it must not require scrolling.

**Secondary, below the fold:** parcel details (size/description), full route (origin → destination, all halts if useful), fare, sender/recipient contact details, and the created/updated timestamps.

**Verification section:** only relevant/shown when applicable — recipients see the PIN entry CTA; everyone else sees a simple "verified" or "pending verification" indicator once delivered, not raw proof internals (hash/nonce stay entirely server-side, correctly — the UI should never need or show them).

**What's honestly not possible right now:** live position, ETA, "N stops away." The `Bus` model has no location field and no telemetry source exists. Don't fake a progress bar that implies real-time tracking — that actively damages trust the first time it's wrong. The stepper (state-based, not distance-based) is the correct honest substitute.

---

## 8. Booking Experience

Ideal flow, same number of decisions as today but resequenced for trust and speed:

1. **Route** — browse/select (unchanged, works well).
2. **Pickup + dropoff halts** — unchanged, the chip-based single-list selection is a genuinely good pattern, keep it exactly.
3. **Who's it for** — this is the friction point, and it's a hard one. **UX issue caused by existing backend constraint**: there is no user-lookup endpoint of any kind (no `GET /users`, no search-by-phone) — `create` only validates that the pasted ID resolves to a real user server-side (throwing `NotFoundException` if not), it doesn't let the client resolve an ID to a name *before* submitting. So today, a sender genuinely cannot confirm "is this the right person" until after the booking is created. One thing that *can* improve it without any backend change: let every user see their own ID on a simple "My Vahak ID" read-only screen (their own `id` is already returned on login/profile — no new endpoint needed) so recipients can share it directly (copy/share-sheet) instead of senders needing to already have it memorized or texted separately. And on the booking confirmation screen (which already fetches the created consignment), surface the resolved recipient's name/phone prominently — the detail endpoint already returns it — so the sender gets an immediate "sent to [name]" check right after booking, catching a mistyped ID in the same session rather than only discovering it when a stranger receives a PIN. Neither of these removes the core friction. If a lightweight `GET /users?phone=` or similar lookup is ever feasible on the backend, that's the highest-ROI backend addition for this flow — worth raising, but out of scope for this UI-only pass.
4. **Parcel** — size (keep the 3-option chip selector, it's minimal and sufficient) + optional description.
5. **Review & confirm** — show the real fare here instead of "determined after booking." Fare is currently a fixed flat constant server-side (`DEMO_FLAT_FARE`, explicitly labeled a demo placeholder in code, not distance/size-based) — nothing prevents showing it before commit today. Worth flagging separately: once real pricing (distance- or size-based) replaces the flat constant, this same review step is where it should surface — design it now so it doesn't need rework later.
6. **Booking success** — tracking code front and center, immediate "Track this parcel" CTA.
7. **Tracking** — lands directly on the detail/tracking screen described above.

Bus ID selection should be removed from the sender-facing form entirely if possible — asking a sender to know which physical bus will carry their parcel is an operational/dispatch decision, not a sender decision, and there's no way for a sender to reasonably know this. If the backend requires it for some flows, default it to unset and treat it as an admin/conductor-side assignment rather than sender input.

---

## 9. Conductor Experience

Design for someone standing on a bus, glancing at their phone between stops, possibly one-handed:

- **Open app → immediately see the queue**, no home-screen tap required. Two clear groups (mirrors what the code already computes): *Needs a decision from you* (BOOKED, unclaimed) and *Yours, in progress* (accepted/in-transit, this conductor).
- **Large tap targets, minimal required reading** — tracking code, route, halt pair, fare on the card; everything else is one tap away.
- **Accept** — single tap, immediate optimistic state change, no modal.
- **Handover** — the PIN reveal is the one moment worth interrupting the flow for. Full-attention presentation (large digits, explicit instruction, live expiry countdown), with a clear "done, I've shared it" dismissal rather than the PIN just sitting in a scrollable card among other content.
- **Pending actions surface without navigating** — if a conductor has an accepted-but-not-yet-handed-over parcel, that should be visible from the queue screen itself, not only discoverable by opening each consignment.

---

## 10. Admin Dashboard UX

Structure around what's real:

- **Network** (renamed from "Overview"): route count, halt count, bus count, active-bus ratio — genuine, already-computed metrics. No filler charts. If active-bus ratio is meaningfully low, that's the one number worth visually emphasizing (it's an actionable signal — "some buses are inactive"); the rest are context.
- **Routes**: table + detail, already well-structured (pagination, nested halt/bus management, delete confirmations). Mostly a visual-polish pass, not a structural one.
- **Find a consignment**: keep as its own first-class tool, not a "search bar bolted onto a Consignments page pretending to be a list." Present the result with the same status-first hierarchy as the mobile tracking screen (consistency across platforms matters for admins who use both).
- **Users, buses as standalone sections**: not warranted yet given no corresponding list/manage endpoints beyond what's nested under routes — don't build navigation for data that isn't independently queryable today.

Every metric shown must trace to a real, already-fetchable number — the current code's discipline about this (the honest "unavailable" messaging rather than fabricated data) is the right instinct; the redesign just needs to make the *available* metrics feel complete on their own rather than feeling like a smaller version of a bigger dashboard that doesn't exist yet.

---

## 11. UX State Strategy

Beyond happy path, explicitly design for:

- **Loading** — already consistent (centered spinner) across both apps; fine to keep as-is initially, upgrade to skeletons later (P2).
- **Empty** — already handled per list screen with reasonable copy ("No consignments yet," "Nothing right now") — keep the pattern, just restyle to match the new visual system.
- **Error (network/API)** — already surfaces via `ErrorBanner` + retry button consistently — good foundation, needs visual weight appropriate to severity (a failed load vs. a failed destructive action shouldn't look identical).
- **Offline** — not currently handled anywhere in the code (no network-state detection). Worth a minimal global banner ("You're offline, showing last loaded data") given field usage (conductor) is the most offline-prone role. This is a real gap, not just polish.
- **Expired PIN** — `DeliveryProof.expiresAt` exists in the schema but isn't surfaced pre-emptively anywhere; the verify call will presumably fail with an error the UI currently shows as a generic message. Needs a specific, distinguishable "this PIN expired" state with a clear next step (contact the conductor — since there's no regenerate endpoint, be upfront about that limitation rather than implying a retry will help).
- **Invalid PIN** — already clears the field on failure (good instinct); needs an explicit attempts-remaining indicator using the schema's `attempts` field, which is tracked but not shown.
- **Already delivered** — `RecipientConsignmentDetailScreen` already handles this with a notice string; needs visual promotion from "muted gray footnote" to an actual resolved/closed state treatment.
- **Cancelled** — same pattern, already conditionally hides the workflow stepper (good instinct) — needs a distinct "closed, not in progress" visual treatment rather than just omitting the stepper.
- **Unauthorized (wrong role/wrong consignment)** — already correctly handled with clear notices ("This delivery isn't addressed to your account," "already accepted by another conductor") — these exist and are well-written; just need to look like meaningful state, not disabled-button fine print.
- **Partial failure (created but not booked)** — already has real recovery logic (`BookingConfirmationScreen`) — this is a genuinely good piece of engineering that the current UI undersells with a small amber text line. Deserves a proper "action needed" treatment.

---

## 12. Design Principles

1. **Every consignment screen answers three questions in under 3 seconds: where is it, what's its status, what happens next — and for whom.** If a user has to read body text to answer any of these, the hierarchy has failed.
2. **Never imply data the backend doesn't have.** No fake live tracking, no invented event timelines, no dashboard metrics that aren't real. Vahak's trust proposition depends on the UI never overstating what it knows — this is a security/logistics product, not a marketing surface.
3. **Status is a first-class visual element, not a label.** Every state gets a distinct color and icon; no two meaningfully different states may share the same visual signature (fix the BOOKED/ACCEPTED collision as the reference case).
4. **The handover PIN moment gets the most design attention in the app.** It's the single highest-trust, highest-stakes interaction in the product — treat it like a security ceremony, not a form field.
5. **Home screens are dashboards, not launchers.** Every role's landing screen must lead with the answer to "what needs me right now," not a menu of destinations.
6. **One tool, one job.** "Find a consignment" is a lookup utility, not a disguised list feature — don't dress it up to look bigger than it is.
7. **Never let a user commit to an action without knowing its real cost.** Fare must be visible before "Confirm booking," not after.
8. **Design the failure, not just the success.** Expired PINs, partial bookings, already-claimed consignments, offline states — these are documented, real code paths today; the UI must treat them as first-class outcomes, not afterthoughts.
9. **Reuse one visual language across mobile and dashboard.** An admin using both should recognize the same status badges, stepper, and card patterns in both places — right now they're independently (if similarly) implemented.
10. **Minimize typed identifiers wherever a scan, a link, or a resolved name can replace them.** Every raw-UUID text field is a trust and completion-rate risk.
11. **Restraint over decoration.** One accent color, one icon set, one type scale, consistent radii — the "premium" feeling comes from consistency and whitespace discipline, not added visual elements.
12. **Be honest about scope.** Where the backend can't yet support a feature (event timeline, live position, consignment search), design the best possible interface for what exists today rather than a placeholder that apologizes for what doesn't.

---

## 13. Priority

**P0 — must fix before launch**
- Home screens redesigned as status-first dashboards for all four roles.
- Fix the BOOKED/ACCEPTED color collision and build the full 6-state status system (color + icon + copy).
- Redesign the handover PIN reveal as a dedicated, high-attention moment.
- Show real fare before final booking confirmation.
- Design explicit states for: expired PIN, invalid PIN (with attempts remaining), already-delivered, cancelled, unauthorized access, partial-booking-failure recovery.
- Fix `IN_TRANSIT` labeling/copy to resolve the "sounds like departure, means arrival" confusion, with role-aware status text.
- De-emphasize "Find a consignment" relative to primary list views on every role.

**P1 — important polish**
- Full design system pass: type scale, icon set, button variants on mobile, card status-awareness.
- Conductor queue as the landing view (not a card tap from home).
- Recipient "share my ID" screen to reduce (not eliminate) the raw-UUID recipient entry friction.
- Offline state handling.
- Unify visual language between mobile and dashboard (shared status badge/stepper design).
- Admin dashboard reframed ("Network" not "Overview"), remove the placeholder "unavailable" messaging in favor of confidently-scoped sections.

**P2 — nice to have**
- Skeleton loading states in place of spinners.
- Bottom-sheet component for PIN reveal and future lightweight forms.
- Dark mode.
- Tabular/monospace styling standardized for all codes and PINs.
- Route-line/transit-themed micro-illustrations for empty states.

---

## Recommended Implementation Order

1. Design tokens first (color, type scale, spacing/radius, icon set) — everything else depends on this existing before screens get touched.
2. Status system (color/icon/copy/stepper) — used on nearly every screen, build once, apply everywhere.
3. Shared components (card, status badge, button variants, info row) — replace the copy-pasted per-screen styles.
4. Home screens (all four roles) — highest-impact, most-visible change.
5. Booking flow (fare-before-confirm, recipient-ID mitigation) — highest-friction flow today.
6. Conductor queue + handover moment — highest-stakes flow today.
7. Tracking/detail screens (sender, recipient, admin) — now consuming the finished status system.
8. Admin dashboard reframe.
9. State coverage pass (error/empty/offline/expired/etc.) across all screens.
10. Polish pass (P2 items).

---

*Send the word to move any section into a Claude Code implementation plan — happy to start with tokens + status system + home screens (steps 1–4 above) as the first implementation slice once you've reviewed this.*
