# EventQuest — Scoring Module

## Responsibility

Calculates authoritative score changes and records score transactions.

## Core Rule

**Scoring happens on the backend. The frontend never calculates final points.**

## Scope

### MUST
- Automatic scoring
- Quiz correctness scoring
- Player scoring
- Team scoring
- Score transaction history

### SHOULD
- Anti-spam cooldown interactions
- Special-event scoring modifiers

## Domain

Primary entity:

- `ScoreTransaction`

Relevant relations:

```text
event
player
team
task_submission
special_event
```

## Rules

- Quiz points are awarded only for correct answers.
- Score changes are server-side.
- Score transactions remain available after media deletion.
- Team scoring is event-scoped.
- Special events can affect scoring during their configured period.

## API

Scoring does not require a standalone public REST endpoint in the Architecture. It is triggered by validated submissions and special-event state.

## Realtime

When scoring changes ranking:

```text
RANKING_UPDATED
```

is published by the realtime layer.

## Dependencies

- Submissions
- Tasks
- Players
- Teams
- Special Events
- Ranking

## Tests

Cover correct/incorrect quiz, task points, duplicate scoring, event isolation, team scoring and special-event modifiers.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
