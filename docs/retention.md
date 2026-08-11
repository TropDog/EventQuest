# EventQuest — Retention Module

## Responsibility

Runs scheduled cleanup and archival jobs and enforces documented multimedia retention.

## Scope

### MUST
- Media retention cleanup

## Rules

```text
Multimedia max retention = 30 days
```

After report generation and organizer download:

```text
report generated
↓
media package prepared
↓
organizer downloads
↓
cleanup deletes multimedia
```

Keep:

- event logs,
- technical logs,
- statistics,
- ranking summaries,
- task statistics,
- score transactions.

## Scheduled Jobs

Architecture defines:

```text
cleanupExpiredMediaJob
cleanupDownloadedReportMediaJob
archiveClosedEventsJob
deleteRevokedCoordinatorTokensJob
```

## Deletion Safety

Cleanup must be:

- event-scoped,
- repeat-safe,
- auditable where appropriate,
- safe against deleting metadata that must remain.

Media deletion should not remove:

- score transactions,
- ranking summaries,
- task statistics,
- required logs.

## Dependencies

- Media
- Reports
- Events
- Coordinator/Auth

## Tests

Cover expiration, early cleanup after download, repeated job execution, event isolation and preservation of non-media records.

## Underspecified Areas

Exact scheduler cadence is not defined in Architecture. Do not invent a production schedule as a business requirement.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
