# EventQuest — Special Events Module

## Responsibility

Creates and controls temporary event-wide gameplay modifiers/challenges.

## Scope

### MUST
- Coordinator special events

## Domain

Primary entity:

- `SpecialEvent`

## Types

```text
HAPPY_HOUR
FLASH_QUEST
GOLDEN_QUEST
TEAM_CHALLENGE
```

## Flow

```text
Coordinator opens panel
↓
Selects special event
↓
Backend validates coordinator token
↓
Special event created
↓
Realtime event broadcast
↓
Player screens update
↓
Big Screen displays event
↓
Scoring rules apply during duration
```

## API

```text
POST /events/:eventId/special-events
GET  /events/:eventId/special-events
POST /events/:eventId/special-events/:specialEventId/end
```

## Rules

- Special event belongs to one event.
- Coordinator/organizer authorization is required.
- Start/end state is server-side.
- Active period is represented by timestamps.
- Scoring effects apply during configured duration.

## Realtime

```text
SPECIAL_EVENT_STARTED
SPECIAL_EVENT_ENDED
```

## Dependencies

- Coordinator
- Events
- Scoring
- Realtime

## Tests

Cover authorization, event isolation, creation, start/end lifecycle and scoring interaction.

## Underspecified Areas

The Architecture names special-event types but does not fully define their individual scoring formulas or detailed UI mechanics. Do not invent them at module implementation time.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
