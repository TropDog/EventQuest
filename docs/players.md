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

## Player Guest Session — MVP Implementation Notes

The following choices are documented implementation defaults for the current player guest-session phase (SOLO scope). They are not additional product rules unless explicitly promoted elsewhere.

### Joinable event status

- Source documents require validating that **event status permits joining**, but do not list exact joinable statuses.
- MVP implementation: only **`ACTIVE`** events accept new player joins.
- `DRAFT`, `CONFIGURED`, `CLOSED`, and `ARCHIVED` reject new joins with `409 Conflict`.

### Guest session lifetime

- The documented `Player` model stores `guest_token_hash` but does **not** define expiry or revocation fields.
- MVP implementation: guest sessions remain valid for the lifetime of the `Player` record.
- Session validation is token hash lookup only; there is no server-side guest-session expiry or logout in this phase.

### Guest session transport

- Subsequent player-authenticated requests use `Authorization: Bearer <guestToken>`.
- The raw guest token is returned **once** on successful join; only its hash is persisted in `Player.guest_token_hash`.

### Nicknames and rejoin

- Nickname is required on join and cannot be changed afterward (`PATCH /players/me/avatar` does not accept nickname).
- **Duplicate nicknames within the same event are allowed** unless a future requirement explicitly forbids them.
- **Rejoin creates a new player**: a new join request always creates a new `Player` record and a new guest token, even when the nickname differs from a prior join. Prior sessions remain valid until removed by a future lifecycle/cleanup rule.

### Team mode join flow

- Team selection is implemented in the **Teams** phase as a two-step flow:
  1. `POST /events/:eventId/players` — creates the player and guest session (team mode allowed; `teamId` remains `null`).
  2. `POST /events/:eventId/teams/:teamId/join` — assigns the player to an available team.
- `GET /events/:eventId/teams` is available without authentication for **ACTIVE** joinable events (pre-session team selection UI). Authenticated organizer, coordinator, and player access is also supported.

### Room code lookup

- Join resolution uses exact `room_code` string match via indexed lookup.
- The ERD notes that `room_code` must identify a joinable room; a database-level uniqueness strategy is deferred to the Events module.
- If multiple events share the same `room_code`, the first matching record is returned — this should be prevented by event creation rules in the Events phase.

### Interim player API contract

Until full DTO specifications are added, the MVP player endpoints use:

**`GET /join/:roomCode` success response:**

```json
{
  "event": {
    "id": "string",
    "name": "string",
    "status": "ACTIVE",
    "gameMode": "SOLO",
    "participantLimit": 100,
    "playerCount": 0
  }
}
```

**`POST /events/:eventId/players` request body:**

```json
{
  "nickname": "string",
  "termsAccepted": true,
  "avatarUrl": "string (optional)"
}
```

**`POST /events/:eventId/players` success response:**

```json
{
  "player": {
    "id": "string",
    "eventId": "string",
    "teamId": null,
    "nickname": "string",
    "avatarUrl": null,
    "termsAcceptedAt": "ISO-8601 datetime",
    "joinedAt": "ISO-8601 datetime",
    "lastSeenAt": null
  },
  "guestToken": "string"
}
```

**`GET /players/me` success response:** the `player` object shape above (without `guestToken`).

**`PATCH /players/me/avatar` request body:**

```json
{
  "avatarUrl": "string | null"
}
```

**`PATCH /players/me/avatar` success response:**

```json
{
  "player": { "...": "same public player shape as above" }
}
```

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
