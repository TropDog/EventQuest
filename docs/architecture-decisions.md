# EventQuest — Architecture Decisions

This document records the architectural decisions explicitly defined in the EventQuest Architecture Document.

The purpose is to prevent an AI coding agent from "improving" the architecture by introducing technologies or patterns that contradict the agreed design.

## ADR-001 — Modular Monolith

**Decision:** Build the MVP as a modular monolith.

**Required direction:**

- keep clear domain/module boundaries,
- do not introduce microservices unless explicitly requested.

**Reason:** The product domains are strongly connected and microservices would add unnecessary complexity during MVP development.

## ADR-002 — PostgreSQL as Primary Database

**Decision:** PostgreSQL is the primary database.

**Required direction:**

- use Prisma ORM,
- keep the relational domain model,
- do not introduce MongoDB, Firebase, Supabase or another database unless explicitly requested.

## ADR-003 — Direct-to-Storage Media Upload

**Decision:** Media files should be uploaded directly from the frontend to S3-compatible object storage using signed upload URLs.

**Required flow:**

```text
Frontend
  ↓
Backend: request upload URL
  ↓
Backend: generate signed URL
  ↓
Frontend
  ↓
Object Storage
  ↓
Frontend: confirm upload
  ↓
Backend: store metadata
```

**Reason:** Large media files should not overload the backend.

The backend stores media metadata and storage keys rather than acting as the binary media transport.

## ADR-004 — WebSocket for Realtime

**Decision:** WebSockets are used for realtime functionality.

Required realtime areas include:

- ranking,
- special events,
- Big Screen Mode,
- media gallery updates,
- task unlocks,
- announcements,
- achievements,
- event closure.

Each event has dedicated realtime channels.

## ADR-005 — Organizer Is the Only Registered User

**Decision:** Only the organizer has a registered account.

### Organizer

- email/password,
- JWT access token,
- refresh token.

### Coordinator

- no account,
- magic link/access token,
- token stored as hash,
- token associated with one event.

### Player

- no account,
- guest session token,
- token associated with player and event.

Do not introduce account creation for coordinators or players unless explicitly requested.

## ADR-006 — Server-Side Scoring

**Decision:** Scoring and ranking are calculated on the backend.

The frontend must never calculate final points.

The backend is the source of truth for:

- scoring,
- ranking,
- task state.

## ADR-007 — No AI Vision in MVP

**Decision:** AI Vision is explicitly excluded from MVP.

AI may:

- generate task suggestions,
- suggest scoring,
- suggest special events,
- generate the post-event summary.

AI must not be used in MVP to validate photos/videos.

The AI Event Summary must not analyze faces or identify people in photos.

## ADR-008 — Sequential Task Progression

**Decision:** Tasks are executed sequentially.

The player receives:

- full visibility of the current task,
- a teaser of the next task,
- only the number of remaining tasks after that.

Agents must not implement unrestricted task browsing as the default gameplay model.

## ADR-009 — Guest Nickname Immutability

**Decision:** A player's nickname cannot be changed after joining.

A nickname change is treated as a new player.

## ADR-010 — Package Limits Are Business Rules

**Decision:** Participant limits are determined by package configuration.

Do not hardcode package limits into unrelated business logic.

The architecture explicitly requires package configuration to determine limits.

## ADR-011 — Backend Authorization Is Mandatory

Every endpoint must validate the applicable:

- actor type,
- event access,
- role permissions,
- event status,
- package limits.

Authorization cannot rely only on frontend route protection.

## ADR-012 — Media Retention

Multimedia is retained for a maximum of 30 days.

If a report is generated and downloaded earlier:

1. report is prepared,
2. media package is created,
3. organizer downloads it,
4. multimedia is deleted.

Logs and statistics remain.

## ADR-013 — Offline First Is Not MVP

Offline-first is a future capability.

MVP should be online-only.

The implementation should not deliberately prevent future:

- local task cache,
- submission queue,
- temporary IDs,
- synchronization,
- conflict resolution,
- upload retry.

Do not implement full offline-first functionality in MVP.

## ADR-014 — Backend Module Boundaries

Backend modules should have clear boundaries and, where applicable:

- controllers,
- services,
- repositories,
- DTOs,
- entity/model definitions,
- guards/policies,
- tests.

The architecture lists the following primary modules:

- auth,
- packages/payments,
- events,
- coordinator,
- players,
- teams,
- tasks,
- submissions,
- scoring,
- ranking,
- achievements,
- special events,
- media,
- AI,
- reports,
- retention,
- realtime.

## ADR-015 — Async Heavy Work

Heavy processing should be asynchronous.

The architecture recommends:

- Redis,
- BullMQ,
- worker jobs.

Examples include:

- report generation,
- AI summary generation,
- media packaging,
- cleanup.

## ADR-016 — Scalability Boundaries

The main anticipated load risks are:

- simultaneous media uploads,
- realtime ranking updates,
- Big Screen activity,
- large events,
- AI summary generation.

The architecture recommends:

- direct-to-storage uploads,
- Redis queues,
- WebSocket rooms per event,
- database indexes on event-related fields,
- ranking snapshot caching,
- asynchronous reports,
- asynchronous AI summaries,
- CDN for media previews.

## ADR-017 — Security Requirements

Passwords:

- hash using bcrypt or argon2,
- never store plaintext passwords.

Tokens:

- coordinator tokens stored as hashes,
- guest session tokens stored as hashes,
- JWT secret stored in environment variables.

Uploads:

- validate file type,
- validate file size,
- validate video duration,
- use signed URLs,
- never expose storage admin credentials to the frontend.
