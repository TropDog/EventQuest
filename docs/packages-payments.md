# EventQuest — Packages & Payments Module

## Responsibility

Handles package configuration, package purchase, checkout, payment webhook and package usage.

## Core Business Rule

```text
1 package purchase = 1 event = 1 room
```

A purchased package is associated with one organizer and is consumed by one event.

Participant limits are package configuration and must not be hardcoded throughout the application.

## Scope

### MUST
- Package selection
- Payment placeholder/integration
- Package purchase
- Payment confirmation
- Participant-limit validation
- Package marked as used

### Provider

Stripe is the initial payment provider defined by Architecture.

Future Polish providers are not an MVP requirement.

## Domain

Primary entity:

- `PackagePurchase`

Relevant fields:

```text
organizer_id
package_type
participant_limit
payment_status
payment_provider
payment_provider_session_id
purchased_at
used_at
```

## API

```text
GET  /packages
POST /payments/checkout
POST /payments/webhook
GET  /package-purchases
```

## Rules

- Package belongs to organizer.
- Package becomes usable only in the appropriate payment state.
- One package cannot create multiple events.
- Participant limit comes from package configuration.
- Webhook handling should be safe to retry.

## Dependencies

- Auth
- Events

## Tests

Cover:

- package listing,
- valid purchase,
- payment state transitions,
- webhook validation,
- repeated webhook/idempotency behavior,
- package reuse rejection,
- participant limit retrieval.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
