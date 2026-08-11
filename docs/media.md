# EventQuest — Media Module

## Responsibility

Handles photo/video storage integration, metadata and gallery.

## Core Architecture

Media must use direct-to-storage upload.

```text
Frontend → Backend: request signed URL
Backend → Storage: generate signed URL
Frontend → Storage: direct upload
Frontend → Backend: confirm upload
Backend → DB: save metadata
Backend → Realtime: MEDIA_UPLOADED
```

The backend must not be used as the large-binary transport path when direct upload is possible.

## Scope

### MUST
- Signed upload URL
- Photo upload
- Video upload
- Media metadata
- Live Gallery
- Media retention integration

### SHOULD
- Media ZIP export

## Limits

```text
Photo max: 15 MB
Video max: 100 MB
Video max duration: 30 seconds

Photos:
jpg, jpeg, png, webp

Videos:
mp4, mov, webm
```

## Domain

Primary entity:

- `MediaAsset`

Metadata includes:

```text
event_id
task_submission_id
player_id
media_type
storage_key
public_url
thumbnail_url
file_size_bytes
duration_seconds
created_at
deleted_at
```

## Gallery

Gallery is:

- event-scoped,
- newest first,
- optionally filterable by task.

API:

```text
GET /events/:eventId/gallery
GET /events/:eventId/gallery?taskId=
```

## Security

- Validate file type.
- Validate file size.
- Validate video duration.
- Never expose storage admin credentials.
- Use signed URLs.

## Realtime

After confirmed metadata:

```text
MEDIA_UPLOADED
```

## Retention

Media is retained for maximum 30 days and may be deleted earlier after report generation/download.

## Dependencies

- Submissions
- Object Storage
- Realtime
- Reports
- Retention

## Tests

Cover signed URL authorization, file constraints, upload confirmation, event isolation, metadata persistence and gallery filtering.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
