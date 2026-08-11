# EventQuest — MVP Backlog

## Purpose

This document translates the EventQuest PRD and Architecture into an implementation-oriented backlog:

```text
Epic
  ↓
Feature
  ↓
User Story
  ↓
Acceptance Criteria
```

The backlog is derived from the documented MVP scope and product requirements.

It intentionally does not create business rules that are absent from the source documents.

---

# Backlog Conventions

## Priority

- `MUST` — explicitly included in MVP Must Have
- `SHOULD` — explicitly listed as Should Have; not required for the first working MVP
- `COULD` — explicitly listed as Could Have; defer unless capacity allows
- `POST-MVP` — explicitly excluded from MVP

## Acceptance Criteria

Acceptance criteria describe observable behavior.

A feature is not considered complete until its acceptance criteria are satisfied and the relevant tests pass.

## Implementation Rule

Implement Epics in the dependency order from `implementation-order.md`.

Do not implement a later Epic by bypassing an earlier dependency.

---

# EPIC 01 — Authentication & Access

Priority: `MUST`

## Goal

Provide secure access for the three EventQuest roles.

## Feature 01.1 — Organizer Registration

### User Story

As an organizer, I want to create an account so that I can own and manage my events.

### Acceptance Criteria

- Organizer can register with email and password.
- Terms acceptance can be recorded.
- Password is never stored in plaintext.
- Organizer account is persisted.
- Invalid registration input is rejected.
- Duplicate account identity is handled consistently.

---

## Feature 01.2 — Organizer Login

### User Story

As an organizer, I want to log in so that I can access my events.

### Acceptance Criteria

- Valid credentials authenticate the organizer.
- Invalid credentials are rejected.
- Access token/session is issued according to the authentication architecture.
- Protected organizer endpoints reject unauthenticated requests.

---

## Feature 01.3 — Refresh Token

### User Story

As an organizer, I want my authenticated session to remain usable without repeatedly logging in.

### Acceptance Criteria

- Valid refresh token can obtain a new access token.
- Invalid/revoked refresh token is rejected.
- Refresh secrets are not exposed to the frontend.

---

## Feature 01.4 — Coordinator Access

### User Story

As an organizer, I want to provide a coordinator with dedicated access to my event without creating another account.

### Acceptance Criteria

- Coordinator access is associated with one event.
- Coordinator uses a dedicated access token/link.
- Token is stored as a hash.
- Expired/revoked access is rejected.
- Coordinator cannot access another event.

---

## Feature 01.5 — Player Guest Session

### User Story

As a player, I want to join without creating an account.

### Acceptance Criteria

- Player can receive an event-scoped guest session.
- Player does not need account registration.
- Session is tied to the correct event/player.
- Player cannot use the session to access another event.

---

# EPIC 02 — Packages & Payments

Priority: `MUST`

## Goal

Implement the package-based business model.

## Feature 02.1 — Package Selection

### User Story

As an organizer, I want to select a package appropriate for my event.

### Acceptance Criteria

- Available package types can be displayed.
- Participant limits come from package configuration.
- Package limits are not hardcoded into unrelated logic.

---

## Feature 02.2 — Package Purchase

### User Story

As an organizer, I want to purchase a package so that I can create an event.

### Acceptance Criteria

- Purchase is associated with the organizer.
- Payment status is stored.
- Payment provider information can be associated with the purchase.
- A package cannot be consumed by multiple events.

---

## Feature 02.3 — Payment Integration / Placeholder

### User Story

As an organizer, I want payment confirmation to unlock my package.

### Acceptance Criteria

- Checkout can be initiated.
- Payment confirmation can be processed.
- Payment webhook is validated.
- Purchase becomes usable only after the appropriate payment state.

---

# EPIC 03 — Event Management

Priority: `MUST`

## Feature 03.1 — Create Event

### User Story

As an organizer, I want to create an event from a valid package.

### Acceptance Criteria

- Organizer can create an event.
- Event belongs to the organizer.
- Event consumes one package purchase.
- Participant limit is derived from package configuration.
- Event receives a room code.

---

## Feature 03.2 — Configure Event

### User Story

As an organizer, I want to configure my event before opening it.

### Acceptance Criteria

- Event can be configured before activation.
- Game mode can be selected as solo or team.
- Event configuration is persisted.
- Invalid configuration cannot be published.

---

## Feature 03.3 — Event Lifecycle

### User Story

As an organizer, I want to open and close my event.

### Acceptance Criteria

Supported event lifecycle:

```text
DRAFT
→ CONFIGURED
→ ACTIVE
→ CLOSED
→ ARCHIVED
```

- Invalid state transitions are rejected.
- Closed events no longer accept normal gameplay.
- Event can be automatically closed according to the documented closing rule.

---

## Feature 03.4 — Room Code & QR

### User Story

As an organizer, I want a QR code and room code so guests can join easily.

### Acceptance Criteria

- Event has a room code.
- QR code points to the event join flow.
- Join flow resolves the correct event.
- Invalid/inactive room codes are rejected.

---

# EPIC 04 — Player Join

Priority: `MUST`

## Feature 04.1 — Join Event

### User Story

As a guest, I want to join an event using a QR code, link or room code.

### Acceptance Criteria

- Join works through the documented entry methods.
- Player sees the correct event context.
- Event participant limit is enforced.
- Closed/non-joinable events reject new players.

---

## Feature 04.2 — Accept Terms

### User Story

As a player, I want to accept the required terms before entering the game.

### Acceptance Criteria

- Terms acceptance is required.
- Acceptance is stored with the player.
- Player cannot proceed without required acceptance.

---

## Feature 04.3 — Choose Nickname

### User Story

As a player, I want to choose a nickname displayed during the event.

### Acceptance Criteria

- Nickname is required.
- Nickname is stored on player creation.
- Nickname cannot be changed after joining.
- A nickname change is treated as a new participant.

---

## Feature 04.4 — Choose Avatar

### User Story

As a player, I want to choose an avatar.

### Acceptance Criteria

- Avatar is optional.
- Player avatar can be stored.
- Avatar does not change identity/session.

---

# EPIC 05 — Teams

Priority: `MUST`

## Feature 05.1 — Configure Teams

### User Story

As an organizer, I want to configure teams for team mode.

### Acceptance Criteria

- Organizer can create/configure teams.
- Team belongs to the event.
- Team capacity is stored.
- Team mode is distinct from solo mode.

---

## Feature 05.2 — Join Team

### User Story

As a player, I want to select an available team.

### Acceptance Criteria

- Only teams belonging to the event are available.
- Full teams cannot accept another player.
- Player can join only when team mode is active.

---

## Feature 05.3 — Change Team Name Once

### User Story

As a team participant, I want to personalize my team's name.

### Acceptance Criteria

- Team name can be changed according to the documented rule.
- A team can change its name at most once.
- After the allowed change, another change is rejected.

---

# EPIC 06 — Tasks

Priority: `MUST`

## Feature 06.1 — Create Task

### User Story

As an organizer, I want to create tasks for my event.

### Acceptance Criteria

Organizer can define the documented task properties, including:

- title/name,
- description,
- type,
- points.

Optional task configuration may include:

- time limit,
- submission limit,
- solo/team mode,
- activation/deactivation,
- evidence requirement.

---

## Feature 06.2 — Edit Task

### User Story

As an organizer, I want to edit a task before/during the allowed lifecycle.

### Acceptance Criteria

- Organizer can edit allowed task fields.
- Unauthorized users cannot edit tasks.
- Event/task state restrictions are respected.

---

## Feature 06.3 — Task Types

### User Story

As an organizer, I want to use different challenge formats.

### Acceptance Criteria

System supports the documented task types:

```text
QUIZ
PHOTO
VIDEO
TEXT
GROUP
TIMED
```

---

## Feature 06.4 — Sequential Task Display

### User Story

As a player, I want tasks to be revealed progressively so that the game has a controlled flow.

### Acceptance Criteria

- Current task is fully visible.
- Next task can be shown as a teaser.
- Player sees the number of remaining tasks.
- Player cannot freely browse all future tasks.

---

## Feature 06.5 — Task Activation

### User Story

As an organizer, I want tasks to activate according to their configured rules.

### Acceptance Criteria

- Task activation state is controlled by backend.
- Time/task progression rules are enforced server-side.
- `TASK_UNLOCKED` can be published through realtime.

---

# EPIC 07 — Submissions

Priority: `MUST`

## Feature 07.1 — Quiz Submission

### User Story

As a player, I want to submit an answer to a quiz task.

### Acceptance Criteria

- Player can submit a quiz answer for the active task.
- Backend validates the task/player context.
- Correct answer can result in points.
- Incorrect answer does not award quiz points.
- Submission limits are enforced.

---

## Feature 07.2 — Text Submission

### User Story

As a player, I want to submit a text answer when a task requires one.

### Acceptance Criteria

- Text submission is associated with the correct task/player/event.
- Submission limits are enforced.
- Backend validates task state.

---

## Feature 07.3 — Photo Submission

### User Story

As a player, I want to submit a photo as evidence for a task.

### Acceptance Criteria

- Player can request a signed upload URL.
- Photo uploads directly to object storage.
- Backend stores metadata after confirmation.
- Supported formats are validated.
- Maximum photo size is enforced.
- Media upload can trigger realtime gallery update.

---

## Feature 07.4 — Video Submission

### User Story

As a player, I want to submit a short video as evidence.

### Acceptance Criteria

- Video uploads directly to object storage.
- Supported video formats are validated.
- Maximum file size is enforced.
- Maximum duration is enforced.
- Backend stores metadata after confirmation.

MVP limits:

```text
100 MB
30 seconds
mp4 / mov / webm
```

---

## Feature 07.5 — Submission Limits & Anti-Spam

Priority: `MUST` for the technical anti-spam foundations; cooldown is `SHOULD`.

### Acceptance Criteria

The backend can enforce documented anti-spam rules including:

- maximum submissions per task/player,
- minimum cooldown,
- maximum media uploads per minute/player,
- maximum failed quiz attempts,
- duplicate submission blocking after limit.

Blocked actions must be auditable.

Possible outcomes:

```text
ALLOW
WARN
COOLDOWN
TEMP_BLOCK
```

---

# EPIC 08 — Media & Gallery

Priority: `MUST`

## Feature 08.1 — Signed Upload URL

### User Story

As a player, I want media uploads to work without sending large files through the application backend.

### Acceptance Criteria

- Backend generates signed upload URL.
- Frontend uploads directly to object storage.
- Backend stores only media metadata/storage keys.
- Storage admin credentials never reach frontend.

---

## Feature 08.2 — Live Gallery

### User Story

As an event participant/host, I want to see uploaded media live.

### Acceptance Criteria

- Gallery displays event media.
- New media can appear through realtime.
- Gallery is ordered newest first.
- Gallery can be filtered by task where supported.

---

# EPIC 09 — Scoring

Priority: `MUST`

## Feature 09.1 — Automatic Scoring

### User Story

As a player, I want valid task completion to award points automatically.

### Acceptance Criteria

- Scoring occurs on backend.
- Score transaction is recorded.
- Frontend cannot set authoritative points.
- Scoring is associated with the correct event/player/task.

---

## Feature 09.2 — Quiz Scoring

### User Story

As a player, I want correct quiz answers to award points.

### Acceptance Criteria

- Correct answer awards configured task points.
- Incorrect answer awards no quiz points.
- Frontend cannot decide correctness.

---

## Feature 09.3 — Team Scoring

### User Story

As a team player, I want team tasks/scoring to contribute to team results.

### Acceptance Criteria

- Team score is associated with the correct event/team.
- Team scoring does not leak across events.
- Ranking can consume team score.

---

# EPIC 10 — Ranking

Priority: `MUST`

## Feature 10.1 — TOP 10

### User Story

As a player, I want to see the top players.

### Acceptance Criteria

- Backend returns authoritative TOP 10.
- Ranking is scoped to the current event.
- Ranking updates when scores change.

---

## Feature 10.2 — Own Position

### User Story

As a player, I want to know my own score and position even if I am outside TOP 10.

### Acceptance Criteria

- Player can see own score.
- Player can see own position.
- Player cannot use this feature to access another player's private session data.

---

## Feature 10.3 — Team Ranking

### User Story

As a team participant, I want to see team ranking.

### Acceptance Criteria

- Team ranking is event-scoped.
- Team score comes from authoritative scoring.
- Team ranking updates after relevant scoring changes.

---

# EPIC 11 — Realtime

Priority: `MUST`

## Feature 11.1 — Event WebSocket Channels

### Acceptance Criteria

Each event can use the documented channels:

```text
event:{eventId}:players
event:{eventId}:coordinator
event:{eventId}:big-screen
event:{eventId}:organizer
```

---

## Feature 11.2 — Ranking Updates

### Acceptance Criteria

When authoritative ranking changes:

```text
RANKING_UPDATED
```

is published to relevant clients.

---

## Feature 11.3 — Gameplay Events

The realtime layer supports:

```text
TASK_UNLOCKED
SPECIAL_EVENT_STARTED
SPECIAL_EVENT_ENDED
MEDIA_UPLOADED
ACHIEVEMENT_UNLOCKED
ANNOUNCEMENT_PUBLISHED
EVENT_CLOSED
```

The backend remains the source of truth.

---

# EPIC 12 — Coordinator & Big Screen

Priority: `MUST`

## Feature 12.1 — Coordinator Panel

### User Story

As a coordinator, I want to control the event without creating an account.

### Acceptance Criteria

- Coordinator can access only the associated event.
- Coordinator access respects token expiry/revocation.
- Coordinator can use permitted hosting functionality.
- Coordinator cannot access organizer-only actions.

---

## Feature 12.2 — Coordinator QR Display

### User Story

As a coordinator, I want to display the player QR code.

### Acceptance Criteria

- QR for the correct event can be displayed.
- Room code can be displayed.

---

## Feature 12.3 — Coordinator Special Events

### User Story

As a coordinator, I want to start special events during gameplay.

### Acceptance Criteria

Supported special events include:

```text
Happy Hour
Flash Quest
Golden Quest
Team Challenge
```

- Start is authorized.
- Active period is stored.
- Realtime start/end events are published.
- Scoring effect follows the configured rules.

---

## Feature 12.4 — Big Screen Ranking

### User Story

As a host, I want a large-screen ranking view.

### Acceptance Criteria

- Ranking is readable on a large display.
- Ranking updates in realtime.
- Fullscreen usage is supported by the presentation layer.

---

# EPIC 13 — Achievements

Priority: `SHOULD`

## Feature 13.1 — Achievement Definitions

### Acceptance Criteria

The system can represent documented achievements such as:

- Pierwsze Zadanie
- Król Selfie
- Pogromca Quizów
- Team Player
- Nocny Marek
- Mistrz Integracji
- Łowca Flash Questów

---

## Feature 13.2 — Award Achievement

### User Story

As a player, I want to receive achievements for notable behavior.

### Acceptance Criteria

- Achievement is awarded to the correct player/event.
- Achievement does not modify ranking position unless a future explicit rule says otherwise.
- Achievement can trigger `ACHIEVEMENT_UNLOCKED`.

---

# EPIC 14 — AI Task Generator

Priority: `SHOULD`

## Feature 14.1 — Generate Task Set

### User Story

As an organizer, I want AI to suggest tasks so that event preparation is faster.

### Acceptance Criteria

AI input can include:

```text
event_type
participant_count
age_range
task_count
party_style
energy_level
game_mode
```

Output can include:

```text
tasks[]
special_event_suggestions[]
points_suggestions[]
```

---

## Feature 14.2 — Organizer Approval

### User Story

As an organizer, I want to review and edit AI-generated tasks before publication.

### Acceptance Criteria

- AI output is not automatically published.
- Organizer can edit generated tasks.
- Organizer can approve tasks.
- Only approved tasks become playable.

---

# EPIC 15 — AI Event Summary

Priority: `SHOULD`

## Feature 15.1 — Generate Event Summary

### User Story

As an organizer, I want a generated summary after the event.

### Acceptance Criteria

Summary can contain:

- narrative summary,
- most active participants,
- most interesting statistics,
- most popular tasks,
- team summary.

AI must not perform face recognition or identify people in photos.

---

# EPIC 16 — Reports

Priority: `MUST`

## Feature 16.1 — Final Report

### User Story

As an organizer, I want a final report after the event.

### Acceptance Criteria

Basic report generation is supported.

Report can collect relevant:

- rankings,
- submissions,
- media,
- achievements where available,
- special events,
- statistics.

Heavy generation runs asynchronously where required.

---

## Feature 16.2 — Media Package

Priority: `SHOULD`

### User Story

As an organizer, I want to download event media.

### Acceptance Criteria

- Media can be packaged for download.
- Packaging can run asynchronously.
- Download is available to the organizer.

---

# EPIC 17 — Retention & Cleanup

Priority: `MUST`

## Feature 17.1 — Media Retention

### User Story

As a system operator, I want old event media removed automatically.

### Acceptance Criteria

- Multimedia retention is maximum 30 days.
- Cleanup runs as a scheduled job.
- Deleted media is no longer available through normal gallery access.
- Logs/statistics remain.

---

## Feature 17.2 — Cleanup After Report Download

### User Story

As an organizer, I want media to remain available until I have had the opportunity to download the report/media package.

### Acceptance Criteria

Documented lifecycle:

```text
Report generated
→ media packaged
→ organizer downloads
→ cleanup job deletes multimedia
```

---

# EPIC 18 — Non-Functional MVP Requirements

Priority: `MUST`

These are cross-cutting requirements rather than user-facing features.

## Feature 18.1 — Mobile First

### Acceptance Criteria

- Primary player experience works on smartphones.
- No native mobile installation is required.
- Player joins through browser.

---

## Feature 18.2 — Scalability for Media

### Acceptance Criteria

Architecture supports many simultaneous media uploads using direct-to-storage uploads rather than routing large files through the backend.

---

## Feature 18.3 — Realtime

### Acceptance Criteria

Ranking and special events update in realtime using the documented WebSocket architecture.

---

## Feature 18.4 — Security

### Acceptance Criteria

- Passwords are hashed.
- Coordinator tokens are stored as hashes.
- Guest tokens are stored as hashes.
- Storage admin credentials are never exposed to frontend.
- Endpoint authorization is validated server-side.

---

# MVP Completion Checklist

## MUST HAVE

- [ ] Organizer registration/login
- [ ] Package selection
- [ ] Payment placeholder/integration
- [ ] Event creation
- [ ] Room code
- [ ] QR code
- [ ] Solo/team mode
- [ ] Teams
- [ ] Player join
- [ ] Terms acceptance
- [ ] Nickname
- [ ] Task creation/editing
- [ ] Sequential task display
- [ ] Quiz submission
- [ ] Photo submission
- [ ] Video submission
- [ ] Automatic scoring
- [ ] TOP 10 ranking
- [ ] Big Screen ranking
- [ ] Coordinator magic link
- [ ] Coordinator QR display
- [ ] Coordinator special events
- [ ] Live Gallery
- [ ] Basic final report
- [ ] Media retention cleanup

## SHOULD HAVE

- [ ] AI task generator
- [ ] Achievements
- [ ] Summary View
- [ ] AI Event Summary
- [ ] Media ZIP export
- [ ] Anti-spam cooldown

## COULD HAVE

- [ ] Advanced animations
- [ ] Multiple visual themes
- [ ] Advanced achievement rules
- [ ] Offline mode
- [ ] Advanced moderation

## EXPLICITLY NOT MVP

- [ ] AI Vision
- [ ] Face recognition
- [ ] Native mobile app
- [ ] Full offline-first
- [ ] Microservices
- [ ] Unlimited scaling guarantees
- [ ] Advanced admin panel

---

# MVP Definition of Done

The MVP backlog is complete when:

1. Every `MUST` feature has implementation and relevant tests.
2. Organizer can create and manage an event.
3. Guests can join without accounts.
4. Players can complete the core supported tasks.
5. Photo/video uploads use direct object storage.
6. Scoring is authoritative on the backend.
7. Ranking works for players and Big Screen.
8. Coordinator can operate the documented event controls.
9. Realtime updates work for documented event changes.
10. A basic final report can be generated.
11. Multimedia cleanup works according to retention rules.
12. Security and authorization rules are enforced server-side.
13. MVP exclusions remain excluded.
