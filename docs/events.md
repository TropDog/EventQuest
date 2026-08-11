# EventQuest — Events Module

## Responsibility

Creates and manages events, configuration, lifecycle, room code and QR code.

## Lifecycle

```text
DRAFT
→ CONFIGURED
→ ACTIVE
→ CLOSED
→ ARCHIVED
```

Invalid transitions must be rejected.

## Scope

### MUST
- Create event
- Configure event
- Solo/team mode
- Room code
- QR code
- Open event
- Close event

## Domain

Primary entity:

- `Event`

Key relationships:

```text
OrganizerAccount 1 ── N Event
PackagePurchase 1 ── 1 Event
Event 1 ── N Player
Event 1 ── N Team
Event 1 ── N Task
```

## API

```text
POST  /events
GET   /events
GET   /events/:eventId
PATCH /events/:eventId
POST  /events/:eventId/open
POST  /events/:eventId/close
GET   /events/:eventId/qr
```

## Business Rules

- Event belongs to one organizer.
- Event consumes one package purchase.
- Room code identifies the joinable event context.
- Participant limit comes from package configuration.
- Closed events no longer accept normal gameplay.
- Default automatic closing is seven days after start according to the documented architecture.
- Organizer can access only owned events.

## Realtime

Closing an event publishes:

```text
EVENT_CLOSED
```

## Dependencies

- Auth
- Packages & Payments
- Players
- Tasks

## Tests

Cover:

- ownership,
- creation from valid package,
- package reuse rejection,
- lifecycle transitions,
- room-code uniqueness/lookup behavior,
- joinability,
- close behavior,
- QR generation/association.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
