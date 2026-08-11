# EventQuest — API Specification

## Purpose

This document defines the REST API surface described by the EventQuest Architecture Document.

It is an implementation-oriented contract for frontend/backend development.

The Architecture provides endpoint paths and responsibilities, but does not define every request/response DTO in full. Where the source documents do not define an exact payload, this document intentionally leaves the payload to the relevant feature/module specification rather than inventing business fields.

---

# 1. API Conventions

## Base

The backend is a NestJS REST API.

The architecture also uses WebSockets for realtime functionality.

## Authentication

### Organizer

Uses:

- JWT access token,
- refresh token.

### Coordinator

Uses:

- magic-link/access token.

### Player

Uses:

- guest session token.

## Authorization

Every protected endpoint must validate:

- actor type,
- event access,
- role permissions,
- event status,
- package limits where relevant.

Backend authorization is authoritative.

---

# 2. Authentication

## POST `/auth/register`

Register an organizer.

### Actor

Public.

### Responsibilities

- create organizer account,
- store password securely,
- record terms acceptance.

### Authentication after registration

The exact response/session behavior is not specified by the Architecture and should be finalized in the feature specification.

---

## POST `/auth/login`

Authenticate an organizer.

### Actor

Public.

### Responsibilities

- validate credentials,
- issue access token/session,
- establish refresh-token flow.

---

## POST `/auth/logout`

Terminate organizer session.

### Actor

Organizer.

---

## POST `/auth/refresh`

Refresh organizer authentication.

### Actor

Organizer session.

---

## GET `/auth/me`

Return the authenticated organizer identity.

### Actor

Organizer.

---

# 3. Packages and Payments

## GET `/packages`

Return available package configurations.

### Actor

Public or organizer-facing depending on implementation.

### Package business rule

```text
1 package = 1 event = 1 room
```

Package limits must come from package configuration.

---

## POST `/payments/checkout`

Create a payment checkout session.

### Actor

Organizer.

### Responsibilities

- validate package,
- create payment provider session,
- associate purchase context.

---

## POST `/payments/webhook`

Receive payment-provider webhook.

### Actor

Payment provider.

### Responsibilities

- validate webhook,
- update `PackagePurchase`,
- mark purchase as paid when payment is confirmed.

The webhook is authoritative for payment confirmation.

---

## GET `/package-purchases`

Return organizer's package purchases.

### Actor

Organizer.

---

# 4. Events

## POST `/events`

Create an event from a valid package purchase.

### Actor

Organizer.

### Responsibilities

- validate paid/available package,
- create event,
- associate package purchase,
- apply package participant limit,
- generate room code.

---

## GET `/events`

List events belonging to the authenticated organizer.

### Actor

Organizer.

### Security

Never return events belonging to another organizer.

---

## GET `/events/:eventId`

Get one organizer-owned event.

### Actor

Organizer.

---

## PATCH `/events/:eventId`

Update event configuration.

### Actor

Organizer.

### Restrictions

Must validate:

- event ownership,
- event status,
- editable fields.

---

## POST `/events/:eventId/open`

Open/activate an event.

### Actor

Organizer.

### Expected transition

Typically:

```text
CONFIGURED → ACTIVE
```

The exact transition rules should be enforced by the event state machine.

---

## POST `/events/:eventId/close`

Close an event.

### Actor

Organizer.

### Responsibilities

- close gameplay,
- prevent further normal gameplay,
- publish `EVENT_CLOSED`.

Events can also close automatically according to the documented lifecycle.

---

## GET `/events/:eventId/qr`

Return/generate the event QR representation.

### Actor

Organizer or coordinator depending on UI flow.

---

# 5. Coordinator

## POST `/events/:eventId/coordinator-access`

Create coordinator access for an event.

### Actor

Organizer.

### Responsibilities

- generate access token,
- store token hash,
- associate token with event,
- define expiry/revocation behavior.

---

## DELETE `/events/:eventId/coordinator-access/:accessId`

Revoke coordinator access.

### Actor

Organizer.

---

## GET `/coordinator/:token`

Resolve coordinator access.

### Actor

Coordinator.

### Responsibilities

- validate token,
- validate expiry/revocation,
- establish coordinator event context.

Coordinator access is limited to one event.

---

# 6. Players

## GET `/join/:roomCode`

Resolve a room code and return the join context.

### Actor

Public player.

### Validation

- room exists,
- event status permits joining,
- participant limit has not been reached.

---

## POST `/events/:eventId/players`

Join an event.

### Actor

Guest player.

### Responsibilities

- validate event,
- require terms acceptance,
- validate nickname,
- validate team if team mode,
- create Player,
- create guest session.

### Rules

- no player account,
- nickname is required,
- nickname cannot later be changed,
- guest session is event-scoped.

---

## GET `/players/me`

Return the current player's event-scoped identity/state.

### Actor

Player.

### Security

Player can only access own player/session context.

---

## PATCH `/players/me/avatar`

Update the current player's avatar.

### Actor

Player.

### Restriction

This endpoint must not permit nickname changes.

---

# 7. Teams

## GET `/events/:eventId/teams`

Return available teams for the event.

### Actor

Organizer, coordinator or player according to the relevant UI flow.

### Player-specific rule

Only teams with available capacity can be selected/joined.

---

## POST `/events/:eventId/teams/:teamId/join`

Join a team.

### Actor

Player.

### Validation

- player belongs to event,
- team belongs to event,
- team has capacity,
- game mode is team mode.

---

## PATCH `/events/:eventId/teams/:teamId/name`

Change team name.

### Actor

Allowed team member / authorized actor according to product flow.

### Business rule

Each team can change its name only once.

---

# 8. Tasks

## GET `/events/:eventId/tasks`

Return tasks available to the authorized actor.

### Actor

Organizer/coordinator/player depending on view.

### Player restriction

Player must not receive unrestricted future-task content.

---

## POST `/events/:eventId/tasks`

Create a task.

### Actor

Organizer.

### Required conceptual fields

The PRD defines:

- name/title,
- description,
- type,
- points.

Optional task properties include:

- time limit,
- number of executions/submissions,
- solo/team mode,
- activation/deactivation,
- evidence requirement.

---

## PATCH `/events/:eventId/tasks/:taskId`

Edit a task.

### Actor

Organizer.

---

## DELETE `/events/:eventId/tasks/:taskId`

Delete a task.

### Actor

Organizer.

### Validation

Must respect event/task lifecycle rules.

---

## GET `/events/:eventId/current-task`

Return the player's current active task.

### Actor

Player.

### Responsibilities

- expose current task,
- expose teaser for next task where appropriate,
- expose remaining task count.

---

## POST `/events/:eventId/tasks/generate-ai`

Generate AI task suggestions.

### Actor

Organizer.

### Input

The Architecture defines these generation inputs:

```text
event_type
participant_count
age_range
task_count
party_style
energy_level
game_mode
```

### Output

```text
tasks[]
special_event_suggestions[]
points_suggestions[]
```

AI output is a suggestion.

Organizer approval/editing is required before publication.

---

# 9. Submissions

## POST `/events/:eventId/tasks/:taskId/submissions`

Submit a task response.

### Actor

Player.

### Supported conceptual submission types

- quiz,
- text,
- other non-media task submissions.

### Validation

- player session,
- event,
- task,
- task activation,
- submission type,
- submission limits,
- anti-spam rules.

For quiz:

```text
correct → points
incorrect → no points
```

---

## POST `/events/:eventId/tasks/:taskId/submissions/media-upload-url`

Request a signed upload URL.

### Actor

Player.

### Responsibilities

- validate player/session,
- validate task,
- validate active task,
- validate media constraints,
- generate signed upload URL.

---

## POST `/events/:eventId/tasks/:taskId/submissions/confirm-media`

Confirm a completed direct-to-storage upload.

### Actor

Player.

### Responsibilities

- validate upload context,
- create TaskSubmission,
- create MediaAsset,
- trigger scoring,
- publish relevant realtime updates.

---

# 10. Ranking

## GET `/events/:eventId/ranking/top`

Return TOP 10 ranking.

### Actor

Player, coordinator, organizer or Big Screen depending on access context.

### Source of truth

Backend scoring/ranking state.

---

## GET `/events/:eventId/ranking/me`

Return current player's own ranking position and score.

### Actor

Player.

---

## GET `/events/:eventId/ranking/teams`

Return team ranking.

### Actor

Authorized event actor.

---

# 11. Special Events

## POST `/events/:eventId/special-events`

Create/start a special event.

### Actor

Coordinator or organizer.

### Types

```text
HAPPY_HOUR
FLASH_QUEST
GOLDEN_QUEST
TEAM_CHALLENGE
```

### Responsibilities

- validate actor,
- create special event,
- publish realtime start,
- apply scoring rules during active window.

---

## GET `/events/:eventId/special-events`

Return special events for an event.

### Actor

Authorized event actor.

---

## POST `/events/:eventId/special-events/:specialEventId/end`

End a running special event.

### Actor

Coordinator or organizer.

---

# 12. Gallery

## GET `/events/:eventId/gallery`

Return event gallery.

### Actor

Authorized event actor.

### Ordering

The PRD defines the live gallery as:

- grid,
- newest first.

---

## GET `/events/:eventId/gallery?taskId=`

Return/filter gallery by task.

### Actor

Authorized event actor.

---

# 13. Reports

## POST `/events/:eventId/reports`

Request final report generation.

### Actor

Organizer.

### Responsibilities

Queue asynchronous report generation.

Report generation may collect:

- rankings,
- submissions,
- media metadata,
- achievements,
- special events.

AI summary generation can be part of the asynchronous process.

---

## GET `/events/:eventId/reports/latest`

Return the latest generated report information.

### Actor

Organizer.

---

## GET `/events/:eventId/reports/download`

Download the final report.

### Actor

Organizer.

### Lifecycle

After report/media package download, multimedia cleanup may run according to retention rules.

---

# 14. Realtime API

Realtime is WebSocket-based rather than REST.

## Event channels

```text
event:{eventId}:players
event:{eventId}:coordinator
event:{eventId}:big-screen
event:{eventId}:organizer
```

## Events

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

## Rule

The backend is the only source of truth.

Realtime events communicate authoritative state changes to connected clients.

---

# 15. API Security Rules

Every endpoint must evaluate the applicable:

```text
actor type
event access
role permissions
event status
package limits
```

Never rely only on frontend authorization.

Never expose:

- password hashes,
- token hashes,
- JWT secrets,
- object-storage admin credentials.

---

# 16. API Implementation Rules

### Controllers

Controllers should:

- validate/request DTOs,
- enforce access guards,
- call application/domain services,
- return API responses.

Controllers should not contain core business logic.

### Services

Services contain business logic.

### Repositories

Repositories encapsulate persistence access where the module uses the repository pattern.

### DTOs

Request/response contracts should be explicitly typed.

### Errors

Business validation failures should use consistent API error semantics across modules.

The exact error-code catalog should be defined in the implementation-level API contract before production hardening.

---

# 17. Missing Details Intentionally Left for Feature Specs

The Architecture does not define every DTO field, HTTP status, pagination contract, error code, rate-limit response or exact response JSON.

Those details should be defined per feature before implementation rather than invented globally.

The next documentation layer should therefore contain feature-level API contracts for each implementation slice.
