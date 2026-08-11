# EventQuest — Players Module

## Responsibility

Handles guest player onboarding and player identity inside an event.

## Scope

### MUST
- Join room
- Terms acceptance
- Nickname
- Avatar
- Team selection in team mode
- Guest session
- Nickname immutability

## Join Flow

```text
QR / Link / Room Code
↓
Resolve event
↓
Validate event
↓
Check participant limit
↓
Accept terms
↓
Nickname
↓
Avatar
↓
Team if applicable
↓
Create player/session
```

## Domain

Primary entity:

- `Player`

Fields:

```text
event_id
team_id
nickname
avatar_url
guest_token_hash
terms_accepted_at
joined_at
last_seen_at
```

## API

```text
GET   /join/:roomCode
POST  /events/:eventId/players
GET   /players/me
PATCH /players/me/avatar
```

## Rules

- Player has no account.
- Terms acceptance is required.
- Nickname is required.
- Nickname cannot be changed after joining.
- A nickname change is treated as a new player.
- Guest session token is hashed.
- Player access is limited to the current event/session.
- Participant limit comes from package configuration.

## Dependencies

- Auth
- Events
- Packages & Payments
- Teams

## Tests

Cover invalid room, closed event, participant limit, terms requirement, nickname requirement, session isolation and avatar update.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
