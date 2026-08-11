# EventQuest — Teams Module

## Responsibility

Manages team-mode configuration and membership.

## Scope

### MUST
- Create/configure teams
- Team capacity
- Join team
- Lock full teams
- One-time team-name change

## Domain

Primary entity:

- `Team`

Fields:

```text
event_id
name
default_number
max_players
name_changed
```

## API

```text
GET   /events/:eventId/teams
POST  /events/:eventId/teams/:teamId/join
PATCH /events/:eventId/teams/:teamId/name
```

Team creation/configuration is organizer-facing functionality even though the architecture does not expose a dedicated team-creation endpoint in its suggested API list.

## Rules

- Team belongs to one event.
- Player and team must belong to the same event.
- Full team cannot accept another player.
- Team name can be changed at most once.
- Team mode is optional; solo mode does not require teams.

## Dependencies

- Auth
- Events
- Players

## Tests

Cover team/event consistency, capacity, joining, full-team rejection and one-time name change.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
