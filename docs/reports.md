# EventQuest — Reports Module

## Responsibility

Generates the final event report and media package.

## Scope

### MUST
- Basic final report generation

### SHOULD
- Media ZIP export
- AI Event Summary integration

## Flow

```text
Organizer closes event
↓
Organizer requests report
↓
Report job queued
↓
Worker collects:
  rankings
  submissions
  media metadata
  achievements
  special events
↓
AI Module generates narrative summary where enabled
↓
Media package prepared where enabled
↓
Report ready
↓
Organizer downloads
```

## API

```text
POST /events/:eventId/reports
GET  /events/:eventId/reports/latest
GET  /events/:eventId/reports/download
```

## Domain

Primary entity:

- `EventSummary`

Relevant data may include:

- AI summary text,
- report URL,
- media package URL,
- generated/download timestamps.

## Async Processing

Report generation should not block normal API requests.

Recommended:

```text
Redis
BullMQ
Worker
```

## Security

Only authorized organizer access may download the final report.

Coordinator must not download the final report.

## Retention Interaction

After report/media package generation and download, multimedia can be deleted according to retention rules.

Logs/statistics remain.

## Dependencies

- Events
- Ranking
- Submissions
- Media
- Achievements
- Special Events
- AI
- Retention

## Tests

Cover report authorization, event closure requirement, queueing, job failure/retry behavior, report readiness and download permissions.

## Underspecified Areas

Exact report file format and exact report layout are not fully specified in Architecture. Do not invent a business requirement and treat it as source truth.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
