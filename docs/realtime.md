# EventQuest — Realtime Module

## Responsibility

Provides WebSocket-based event-specific realtime communication.

## Core Rule

**Backend is the only source of truth.**

Realtime communicates authoritative state changes; it does not create a parallel gameplay state engine.

## Channels

Each event should have its own channels:

```text
event:{eventId}:players
event:{eventId}:coordinator
event:{eventId}:big-screen
event:{eventId}:organizer
```

## Events

```text
RANKING_UPDATED
TASK_UNLOCKED
SPECIAL_EVENT_STARTED
SPECIAL_EVENT_ENDED
MEDIA_UPLOADED
ACHIEVEMENT_UNLOCKED
ANNOUNCEMENT_PUBLISHED
EVENT_CLOSED
```

## Responsibilities

- Authenticate/authorize socket context.
- Bind clients to the correct event channel.
- Publish authoritative event updates.
- Keep event data isolated.
- Support reconnect behavior at the transport/application level.

## Main Producers

```text
Scoring → RANKING_UPDATED
Tasks → TASK_UNLOCKED
Special Events → STARTED / ENDED
Media → MEDIA_UPLOADED
Achievements → ACHIEVEMENT_UNLOCKED
Coordinator/Organizer messaging → ANNOUNCEMENT_PUBLISHED
Events → EVENT_CLOSED
```

## Main Consumers

- Player UI
- Coordinator Panel
- Big Screen
- Organizer live views

## Security

A client must not subscribe to another event's channel without valid access.

Realtime authorization must respect:

- actor type,
- event access,
- role permissions.

## Technology

Architecture allows:

- Socket.IO
- native NestJS WebSocket Gateway

The project should choose one implementation and use it consistently.

## Scalability

Architecture recommends:

- WebSocket rooms per event,
- Redis where required for asynchronous/heavy work,
- ranking snapshot caching,
- event-scoped communication.

## Tests

Cover:

- connection authorization,
- event isolation,
- channel membership,
- ranking update,
- special-event update,
- media update,
- event closure,
- reconnect behavior.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
