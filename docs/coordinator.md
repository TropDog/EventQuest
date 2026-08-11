# EventQuest — Coordinator Module

## Responsibility

Provides dedicated event-host access without account registration.

The coordinator can operate the event through a magic link/access token.

## Scope

### MUST
- Generate coordinator link
- Revoke coordinator link
- Validate access
- Enforce coordinator permissions
- QR display
- Big Screen access
- Special-event control

## Domain

Primary entity:

- `CoordinatorAccess`

Fields:

```text
event_id
token_hash
is_active
expires_at
revoked_at
```

## API

```text
POST   /events/:eventId/coordinator-access
DELETE /events/:eventId/coordinator-access/:accessId
GET    /coordinator/:token
```

## Allowed Actions

Coordinator can:

- display player QR,
- display room code,
- display ranking,
- start/end special events,
- use Big Screen Mode,
- view gallery,
- use Summary View,
- publish messages.

Coordinator cannot:

- purchase packages,
- create events,
- delete events,
- manage payments,
- download final reports.

## Security

- Token stored as hash.
- Access tied to exactly one event.
- Expiry/revocation checked server-side.
- Every coordinator request must resolve the event context.

## Realtime

Coordinator actions can produce:

```text
SPECIAL_EVENT_STARTED
SPECIAL_EVENT_ENDED
ANNOUNCEMENT_PUBLISHED
```

## Dependencies

- Auth
- Events
- Special Events
- Realtime

## Tests

Cover token validity, expiry, revocation, event isolation, role restrictions and permitted/forbidden actions.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
