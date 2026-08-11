# EventQuest — Achievements Module

## Responsibility

Awards engagement achievements to players.

## Priority

`SHOULD HAVE`

Achievements support engagement and do not affect ranking position.

## Domain

Entities:

- `Achievement`
- `PlayerAchievement`

## Documented Examples

```text
Pierwsze Zadanie
Król Selfie
Pogromca Quizów
Team Player
Nocny Marek
Mistrz Integracji
Łowca Flash Questów
```

## Rules

- Achievement definition is reusable.
- Award belongs to player/event.
- Achievement does not modify ranking position.
- Duplicate awarding within an event should be prevented unless future requirements explicitly allow repeatable achievements.

## Realtime

Award can publish:

```text
ACHIEVEMENT_UNLOCKED
```

## Dependencies

- Players
- Tasks
- Submissions
- Scoring
- Special Events
- Realtime

## Tests

Cover qualifying actions, non-qualifying actions, event isolation and duplicate prevention.

## Underspecified Areas

The Architecture names achievement examples but does not fully define every achievement rule. Do not invent exact thresholds without a feature-level decision.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
