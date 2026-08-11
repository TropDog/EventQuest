# EventQuest — AI Module

## Responsibility

Provides the documented AI capabilities:

1. AI Task Generator
2. AI Event Summary

AI is an assistive feature, not the source of truth for gameplay.

## Priority

- Task Generator: `SHOULD HAVE`
- Event Summary: `SHOULD HAVE`

## AI Task Generator

### Inputs

```text
event_type
participant_count
age_range
task_count
party_style
energy_level
game_mode
```

### Outputs

```text
tasks[]
special_event_suggestions[]
points_suggestions[]
```

### Mandatory Approval Flow

```text
Generate
↓
Review
↓
Edit
↓
Organizer approves
↓
Publish
```

AI-generated tasks must never become playable automatically.

## AI Event Summary

### Inputs

Architecture defines:

- event metadata,
- ranking,
- team results,
- task statistics,
- achievement statistics,
- special events,
- selected captions/text submissions.

### Outputs

- narrative summary,
- most active players,
- most popular tasks,
- team summary,
- interesting statistics.

## Restrictions

- No AI Vision in MVP.
- AI does not validate photos/videos.
- AI Summary must not analyze faces.
- AI Summary must not identify people in photos.

## Provider

Architecture allows:

- OpenAI API
- Azure OpenAI

The selected provider should be configured rather than hardcoded into business logic.

## Async

AI Summary generation should be asynchronous for heavy workloads.

Recommended infrastructure:

- Redis
- BullMQ

## API

```text
POST /events/:eventId/tasks/generate-ai
```

The Architecture does not define a separate public summary-generation endpoint; summary generation is part of report/event processing.

## Dependencies

- Tasks
- Events
- Ranking
- Achievements
- Special Events
- Reports

## Tests

Cover input validation, generation result validation, approval requirement, failure handling and prohibition of automatic publication.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
