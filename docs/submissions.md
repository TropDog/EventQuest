# EventQuest — Submissions Module

## Responsibility

Accepts and validates player task submissions.

## Scope

### MUST
- Quiz submission
- Photo submission
- Video submission
- Text submission where supported
- Submission limits
- Technical anti-spam rules

## API

```text
POST /events/:eventId/tasks/:taskId/submissions
POST /events/:eventId/tasks/:taskId/submissions/media-upload-url
POST /events/:eventId/tasks/:taskId/submissions/confirm-media
```

## Submission Validation

Before accepting a submission validate:

1. player session,
2. event,
3. task,
4. task activation,
5. task/submission type,
6. submission limit,
7. anti-spam rules.

## Quiz

Correct answer:

```text
correct → points
incorrect → no points
```

Correctness is determined by backend logic.

## Anti-Spam

Architecture defines:

- max submissions per task/player,
- minimum cooldown,
- max media uploads per minute/player,
- max failed quiz attempts,
- duplicate blocking after configured limit.

Possible actions:

```text
ALLOW
WARN
COOLDOWN
TEMP_BLOCK
```

Every block must be recorded in audit log.

## Dependencies

- Players
- Tasks
- Media
- Scoring
- Auth
- Audit/logging

## Tests

Cover valid/invalid task state, wrong event/player, duplicate submissions, limits, cooldown and quiz attempts.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
