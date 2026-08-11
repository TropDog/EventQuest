# EventQuest — Coding Rules for AI Agents

These rules are intended for Cursor, Claude Code and other AI coding agents.

## 1. Technology Rules

Use:

- TypeScript across frontend and backend,
- Next.js for frontend,
- NestJS for backend,
- PostgreSQL as primary database,
- Prisma ORM,
- modular monolith architecture.

Do not introduce another primary database or framework unless explicitly requested.

## 2. Architecture Rules

Do not introduce microservices for MVP.

Keep domain/module boundaries clear.

Backend modules should remain independently understandable and should expose functionality through their intended application interfaces.

Do not move business logic into controllers.

Do not bypass module boundaries simply because a shortcut is easier.

## 3. Source of Truth

The backend is the source of truth for:

- task state,
- scoring,
- ranking.

The frontend must never calculate final points.

Frontend calculations may be used for presentation only when they do not become authoritative business state.

## 4. Authentication and Authorization

There are three access models:

```text
Organizer  → registered account + JWT
Coordinator → magic link/access token
Player      → guest session token
```

Do not add registration flows for coordinators or players.

Every endpoint must validate applicable:

- actor type,
- event access,
- role permissions,
- event status,
- package limits.

Organizer access must be restricted to events owned by that organizer.

## 5. Security

Passwords must be hashed with bcrypt or argon2.

Never store plaintext passwords.

Coordinator tokens must be stored as hashes.

Guest session tokens must be stored as hashes.

JWT secrets must be supplied through environment variables.

Never expose object-storage administrative credentials to the frontend.

## 6. Media

Do not route large media binaries through the backend when avoidable.

Use signed upload URLs.

Preferred flow:

```text
request signed URL
→ upload directly to storage
→ confirm upload
→ save metadata
```

Backend stores media metadata/storage keys.

Validate:

- file type,
- file size,
- video duration.

MVP limits defined by the architecture:

- photo max 15 MB,
- video max 100 MB,
- video max duration 30 seconds.

## 7. Tasks

Tasks are sequential.

The supported task types are:

```text
QUIZ
PHOTO
VIDEO
TEXT
GROUP
TIMED
```

A player should not receive unrestricted access to future tasks unless the documented task activation logic allows it.

Nickname changes are not supported after joining.

## 8. Scoring

Scoring must happen server-side.

Quiz points are awarded only after a correct answer.

Submission rules and anti-spam rules must be validated by the backend.

Every scoring change should remain traceable through the scoring model/history.

## 9. Ranking

Ranking is derived from backend scoring.

Player ranking requirements include:

- TOP 10,
- player's own position,
- player's own score,
- team ranking where applicable.

Ranking changes are published through realtime.

## 10. Realtime

Use WebSockets for realtime functionality.

Each event has event-specific channels.

The frontend receives authoritative state changes from the backend.

Do not create a second client-side scoring/ranking system.

## 11. AI

AI is allowed for:

- task generation,
- point suggestions,
- special-event suggestions,
- event summary.

AI-generated tasks must be reviewable and editable by the organizer before publication.

Do not implement AI Vision in MVP.

Do not implement face recognition.

Do not use AI to identify people in event photos.

## 12. Async Jobs

Use Redis/BullMQ for heavy asynchronous work where defined by the architecture.

Examples:

- report generation,
- AI summary generation,
- media packaging,
- cleanup.

Do not block normal API requests on long-running report/media/AI jobs.

## 13. Data Retention

Media must not be retained indefinitely.

Maximum media retention is 30 days.

Media can be deleted earlier after report generation and download.

Keep the required logs and statistics.

## 14. Database

Use Prisma ORM with PostgreSQL.

Keep domain enums in the shared package.

The architecture identifies important indexes around:

- event IDs,
- player IDs,
- team IDs,
- task IDs,
- submission IDs,
- media/event relationships,
- special events.

Do not remove required indexes without an explicit architectural reason.

## 15. MVP Boundaries

Do not implement the following as MVP features unless explicitly requested:

- AI Vision,
- face recognition,
- native mobile application,
- full offline-first,
- microservices,
- advanced admin panel,
- advanced moderation,
- advanced achievement rules,
- advanced animations,
- multiple visual themes.

## 16. AI Agent Behavior

Before changing code:

1. read the relevant project documentation,
2. identify the module being changed,
3. identify its dependencies,
4. inspect existing implementation,
5. make the smallest change that satisfies the requirement.

Do not invent missing business rules.

If requirements conflict or are insufficient to implement safely, surface the conflict instead of silently creating a new product rule.

After implementation:

1. run relevant tests,
2. run type checking,
3. run linting where configured,
4. verify the changed flow,
5. report remaining issues.

## 17. Change Discipline

Avoid unrelated refactors during feature implementation.

Do not replace an existing technology or architecture decision without explicit instruction.

Do not create duplicate implementations of the same business logic.

Prefer existing shared types, utilities and domain abstractions where they already exist.

## 18. Documentation

When implementation changes a documented business or architecture rule, update the relevant documentation instead of allowing code and documentation to diverge.

The PRD and Architecture remain source documents. Derived AI documentation must not silently contradict them.
