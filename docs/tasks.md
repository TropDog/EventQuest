# EventQuest — Tasks Module

## Responsibility

Creates, edits, orders and exposes sequential event tasks.

## Scope

### MUST
- Task creation
- Task editing
- Sequential display
- Task activation
- Current task
- Next-task teaser
- Remaining-task count

## Task Types

```text
QUIZ
PHOTO
VIDEO
TEXT
GROUP
TIMED
```

## Domain

Primary entity:

- `Task`

Key fields:

```text
event_id
sequence_number
title
description
teaser
task_type
points
is_active
activation_strategy
time_limit_seconds
max_submissions_per_player
starts_at
ends_at
```

## API

```text
GET    /events/:eventId/tasks
POST   /events/:eventId/tasks
PATCH  /events/:eventId/tasks/:taskId
DELETE /events/:eventId/tasks/:taskId
GET    /events/:eventId/current-task
POST   /events/:eventId/tasks/generate-ai
```

## Gameplay Rules

- Tasks are sequential.
- Current task is fully visible.
- Next task may show a teaser.
- Player sees only the number of remaining tasks beyond the teaser.
- Backend controls activation/task state.
- Frontend must not become the source of truth for task activation.

## Dependencies

- Events
- Players
- Submissions
- AI

## Tests

Cover sequence ordering, event isolation, activation, task visibility and time/submission constraints.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
