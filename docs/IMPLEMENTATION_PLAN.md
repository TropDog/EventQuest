# EventQuest — Implementation Plan

## Purpose

This document converts the documented roadmap, backlog, domain model, ERD, API surface and UI flows into an implementation sequence for AI-assisted development.

The goal is to give Cursor/Claude Code a deterministic order of work.

---

# 1. Development Strategy

Use vertical slices while respecting domain dependencies.

For each feature:

```text
Documentation
  ↓
Database/model
  ↓
Backend business logic
  ↓
API
  ↓
Frontend UI
  ↓
Realtime/media where applicable
  ↓
Tests
  ↓
Verification
```

Do not build a large frontend shell first and postpone the backend.

Do not build every database table first and leave all behavior for later.

---

# 2. Repository Foundation

## Step 1 — Repository

Create/verify:

```text
README
docs/
apps/
packages/
```

The exact repository layout may follow the architecture's recommended monorepo structure.

---

## Step 2 — Frontend Application

Technology:

- Next.js
- React
- TypeScript
- Tailwind CSS

Verify:

- development server,
- production build,
- TypeScript,
- basic routing.

---

## Step 3 — Backend Application

Technology:

- NestJS
- TypeScript

Verify:

- application startup,
- environment loading,
- REST API bootstrap,
- basic health endpoint,
- error handling foundation.

---

## Step 4 — Shared Package

Create shared types for:

- domain enums,
- API/shared schemas where appropriate,
- common types.

Architecture rule:

**Keep all domain enums in the shared package.**

---

## Step 5 — Database

Set up:

- PostgreSQL,
- Prisma,
- migration workflow,
- development database.

Do not finalize production deployment infrastructure before the domain model has been validated.

---

# 3. Domain Foundation

Implement the core relational model in dependency order.

Recommended sequence:

```text
OrganizerAccount
↓
PackagePurchase
↓
Event
↓
CoordinatorAccess
↓
Team
↓
Player
↓
Task
↓
TaskSubmission
↓
MediaAsset
↓
ScoreTransaction
↓
RankingSnapshot
↓
Achievement / PlayerAchievement
↓
SpecialEvent
↓
AiGeneratedTaskSet
↓
EventSummary
↓
AuditLog
```

Validate:

- foreign keys,
- event ownership,
- event-scoped relationships,
- package/event one-to-one rule,
- task sequence uniqueness,
- team/player consistency.

---

# 4. Authentication

## 4.1 Organizer Registration

Implement:

- DTO,
- validation,
- password hashing,
- account creation,
- terms acceptance.

Tests:

- valid registration,
- invalid email,
- invalid password,
- duplicate account,
- password not stored plaintext.

---

## 4.2 Organizer Login

Implement:

- credential validation,
- access token,
- refresh token,
- protected route guard.

Tests:

- valid login,
- invalid password,
- invalid email,
- missing credentials,
- protected route rejection.

---

## 4.3 Refresh / Logout / Me

Implement:

- refresh,
- logout/revocation strategy,
- authenticated organizer identity.

---

## 4.4 Coordinator Access

Implement:

- token generation,
- token hashing,
- token validation,
- expiry,
- revocation,
- event binding.

---

## 4.5 Player Guest Session

Implement:

- guest token generation,
- token hashing,
- event/player binding,
- session guard.

---

# 5. Packages & Payments

## 5.1 Package Configuration

Create package configuration.

Do not hardcode participant limits in unrelated modules.

---

## 5.2 Purchase

Implement:

- purchase creation,
- purchase status,
- organizer association,
- one-use package constraint.

---

## 5.3 Checkout

Implement Stripe initially or the agreed payment placeholder.

---

## 5.4 Webhook

Implement:

- webhook signature validation,
- idempotent payment handling,
- purchase status update.

Payment webhooks must be safe to retry.

---

# 6. Event Management

Implement:

- event creation,
- ownership,
- configuration,
- room code,
- QR,
- status machine,
- open,
- close,
- automatic close job.

Validate:

```text
DRAFT
→ CONFIGURED
→ ACTIVE
→ CLOSED
→ ARCHIVED
```

Do not allow arbitrary state transitions.

---

# 7. Player Onboarding

Implement complete join flow:

```text
QR / Link / Room Code
↓
Resolve event
↓
Validate availability
↓
Terms
↓
Nickname
↓
Avatar
↓
Team if applicable
↓
Create guest session
↓
Current task
```

Tests should cover:

- invalid room,
- closed event,
- participant limit,
- missing terms,
- missing nickname,
- full team,
- wrong event/session access.

---

# 8. Teams

Implement:

- team creation/configuration,
- team capacity,
- team join,
- team name change,
- one-change restriction.

Enforce event consistency:

```text
player.event_id == team.event_id
```

---

# 9. Tasks

Implement task CRUD.

Then implement:

1. ordering,
2. sequence,
3. activation,
4. current task,
5. next teaser,
6. remaining count,
7. time limit,
8. submission limit.

Supported task types:

```text
QUIZ
PHOTO
VIDEO
TEXT
GROUP
TIMED
```

Do not implement unrestricted future-task browsing.

---

# 10. Submissions

Implement in this order:

```text
Text
↓
Quiz
↓
Photo
↓
Video
↓
Group
↓
Timed
```

For each submission:

```text
Authenticate player
↓
Validate event
↓
Validate task
↓
Validate task state
↓
Validate submission limit
↓
Persist submission
↓
Score
↓
Publish realtime
```

---

# 11. Media Upload

Implement separately from normal API payloads.

Flow:

```text
Player
↓
Request signed URL
↓
Backend validates
↓
Signed URL
↓
Direct upload to storage
↓
Confirm upload
↓
Create MediaAsset
↓
Submission
↓
Scoring
↓
MEDIA_UPLOADED
```

Enforce:

```text
Photo ≤ 15 MB
Video ≤ 100 MB
Video ≤ 30 seconds
```

Do not send large binaries through NestJS unless explicitly required by a future architecture change.

---

# 12. Scoring

Implement:

- score transactions,
- quiz correctness,
- task points,
- team scoring,
- special-event modifiers.

Rules:

- backend is authoritative,
- frontend cannot set points,
- score transaction is traceable.

Tests must verify that clients cannot manipulate score through request payloads.

---

# 13. Ranking

Implement:

- ranking calculation,
- TOP 10,
- own position,
- team ranking,
- snapshot/cache strategy where required.

Then expose:

```text
GET /ranking/top
GET /ranking/me
GET /ranking/teams
```

Verify ranking against score transactions.

---

# 14. Realtime

Implement WebSocket infrastructure after authoritative state-changing operations exist.

Channels:

```text
event:{eventId}:players
event:{eventId}:coordinator
event:{eventId}:big-screen
event:{eventId}:organizer
```

Events:

```text
RANKING_UPDATED
TASK_UNLOCKED
SPECIAL_EVENT_STARTED
SPECIAL_EVENT_ENDED
MEDIA_UPLOADED
ACHIEVEMENT_UNLOCKED
ANNOUNCEMENT_PUBLISHED
EVENT_CLOSED
```

Test:

- correct event isolation,
- unauthorized channel access,
- reconnect,
- event updates,
- stale client behavior.

---

# 15. Coordinator

Implement:

- coordinator authentication/access,
- QR/room-code view,
- ranking,
- special events,
- gallery,
- Big Screen.

Do not expose organizer-only actions.

---

# 16. Big Screen

Implement presentation-specific UI:

- fullscreen,
- ranking,
- alerts,
- new challenge,
- round summary,
- live gallery,
- summary view.

Big Screen consumes authoritative realtime state.

---

# 17. Achievements

Priority: SHOULD.

Implement:

- achievement definitions,
- rule evaluation,
- award,
- player achievement display,
- realtime achievement notification.

Do not modify score unless an explicit scoring rule is documented.

---

# 18. AI Task Generator

Priority: SHOULD.

Implement only after core task creation/editing works.

Flow:

```text
Organizer
↓
Generation parameters
↓
AI
↓
Task suggestions
↓
Organizer review
↓
Edit
↓
Approve
↓
Publish
```

Never automatically publish AI output.

---

# 19. AI Event Summary

Priority: SHOULD.

Run after event closure.

Flow:

```text
Closed Event
↓
Collect statistics
↓
AI summary
↓
Store EventSummary
↓
Include in report
```

Do not send unnecessary personal/media-identifying data to AI.

No face recognition.

No AI Vision in MVP.

---

# 20. Reports

Implement asynchronously:

```text
Request
↓
Queue
↓
Worker
↓
Collect data
↓
Generate report
↓
Generate media package
↓
Optional AI summary
↓
Ready
↓
Download
```

Use Redis/BullMQ for long-running work.

---

# 21. Retention

Implement scheduled jobs:

```text
cleanupExpiredMediaJob
cleanupDownloadedReportMediaJob
archiveClosedEventsJob
deleteRevokedCoordinatorTokensJob
```

Media:

```text
maximum 30 days
```

Earlier cleanup may happen after report/media download.

Keep required logs/statistics.

---

# 22. Frontend Implementation Order

For each role:

## Organizer

```text
Auth
↓
Dashboard
↓
Packages
↓
Event creation
↓
Event configuration
↓
Teams
↓
Tasks
↓
Live event
↓
Report
```

## Player

```text
Join
↓
Terms
↓
Nickname
↓
Avatar
↓
Team
↓
Task
↓
Submission
↓
Score
↓
Ranking
↓
Gallery
```

## Coordinator

```text
Access
↓
Event home
↓
QR / Room Code
↓
Ranking
↓
Special Events
↓
Gallery
↓
Big Screen
```

---

# 23. Testing Strategy

Every module should have appropriate tests.

## Unit

Test:

- business rules,
- scoring,
- state transitions,
- package limits,
- team capacity,
- task activation,
- achievement rules.

## Integration

Test:

- database interaction,
- authentication,
- authorization,
- API/service integration,
- upload confirmation,
- payment webhook.

## E2E

At minimum, cover the critical path:

```text
Organizer registers
↓
Package available/purchased
↓
Event created
↓
Tasks configured
↓
Player joins
↓
Player accepts terms
↓
Player chooses nickname
↓
Player completes task
↓
Submission accepted
↓
Points awarded
↓
Ranking updates
```

Also cover:

```text
Coordinator access
→ start special event
→ realtime update
```

and:

```text
Report generation
→ download
→ media cleanup
```

---

# 24. AI Agent Execution Loop

For every implementation task:

```text
1. Read README_AI.md
2. Read relevant source documentation
3. Read relevant module documentation
4. Inspect current code
5. Identify dependencies
6. Write implementation plan
7. Implement
8. Run tests
9. Run typecheck
10. Run lint
11. Run build where appropriate
12. Review changed files
13. Update documentation/checklist
14. Report result
```

The agent should not start coding from a vague prompt if the required feature specification does not exist.

---

# 25. Git Workflow

Recommended:

```text
main
  ↓
feature/<module>-<feature>
  ↓
implementation
  ↓
tests
  ↓
review
  ↓
merge
```

Keep commits focused.

Avoid mixing:

```text
feature implementation
+
unrelated refactor
+
dependency migration
```

in one change.

---

# 26. Definition of a Completed Feature

A feature is complete when:

- documented behavior is implemented,
- authorization is enforced,
- business rules are server-side,
- relevant tests pass,
- TypeScript passes,
- lint passes,
- build passes where applicable,
- no known critical error remains,
- documentation is updated if behavior changed.

---

# 27. First Coding Milestone

The first meaningful vertical slice should be:

```text
Repository foundation
↓
Organizer registration/login
↓
Package/event creation
↓
Player join
↓
One basic task
↓
One submission
↓
Server-side scoring
↓
Basic ranking
```

Only after this critical path works should the project expand into:

- media,
- realtime,
- coordinator,
- Big Screen,
- achievements,
- AI,
- reports.

This minimizes the risk of building infrastructure around an unvalidated gameplay core.
