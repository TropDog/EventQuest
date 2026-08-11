# EventQuest — MVP Roadmap

## Purpose

This roadmap translates the PRD and Architecture into implementation phases.

It is a development roadmap, not a promise of dates.

## Phase 0 — Foundation

Goal: create a stable technical base.

Scope:

- repository,
- frontend application,
- backend application,
- shared package,
- PostgreSQL,
- Prisma,
- environment configuration,
- base testing/linting,
- common infrastructure.

Exit condition:

- frontend and backend start,
- database connection works,
- Prisma migration workflow works,
- shared types can be consumed.

## Phase 1 — Identity and Access

Goal: establish the three EventQuest access models.

Scope:

- organizer registration/login,
- JWT/refresh,
- coordinator access,
- player guest session,
- authorization guards.

Exit condition:

- organizer can authenticate,
- coordinator can access one event through token,
- player can access one event through guest session.

## Phase 2 — Commercial Core

Goal: make the pay-per-event model executable.

Scope:

- package listing,
- package purchase,
- payment integration/placeholder,
- webhook,
- package ownership,
- package usage,
- participant limits.

Business rule:

```text
1 package = 1 event = 1 room
```

## Phase 3 — Event Creation

Goal: organizer can create and configure an event.

Scope:

- event creation,
- event settings,
- event status,
- room code,
- QR code,
- opening/closing.

## Phase 4 — Player Onboarding

Goal: guests can join without accounts.

Scope:

- QR/link/room-code join,
- terms acceptance,
- nickname,
- avatar,
- team selection,
- guest session.

## Phase 5 — Gameplay Core

Goal: a complete basic game can run.

Scope:

- task CRUD,
- sequential task progression,
- current task,
- next-task teaser,
- remaining-task count,
- quiz,
- text,
- photo,
- video,
- group/timed task foundations.

## Phase 6 — Scoring and Ranking

Goal: gameplay becomes competitive.

Scope:

- automatic scoring,
- score transactions,
- TOP 10,
- own position,
- team ranking,
- server-side scoring.

## Phase 7 — Realtime

Goal: event state updates live.

Scope:

- event WebSocket rooms,
- ranking updates,
- task unlocks,
- special-event updates,
- media uploads,
- achievements,
- announcements,
- event closure.

## Phase 8 — Coordinator and Big Screen

Goal: an event can be actively hosted.

Scope:

- coordinator panel,
- QR display,
- room-code display,
- special events,
- ranking,
- gallery,
- Big Screen Mode,
- event alerts,
- challenge presentation,
- Summary View.

## Phase 9 — Media and Gallery

Goal: the event produces a usable shared media collection.

Scope:

- signed upload URLs,
- direct object-storage upload,
- media metadata,
- gallery,
- task filtering,
- previews.

## Phase 10 — Engagement Features

Goal: increase engagement beyond basic scoring.

Scope:

- achievements,
- Happy Hour,
- Flash Quest,
- Golden Quest,
- Team Challenge.

## Phase 11 — AI

Goal: reduce organizer effort and create post-event value.

Scope:

- AI task generator,
- point suggestions,
- special-event suggestions,
- AI Event Summary.

Important:

- organizer approves/edits generated tasks,
- no AI Vision,
- no face recognition.

## Phase 12 — Reports and Retention

Goal: close the event lifecycle.

Scope:

- final report,
- AI summary,
- media package,
- report download,
- media deletion after download,
- 30-day media cleanup,
- archive/cleanup jobs.

## MVP Priority

### Must Have

- organizer registration/login,
- package selection/payment placeholder or integration,
- event creation,
- room code + QR,
- solo/team mode,
- teams,
- player join,
- terms acceptance,
- nickname,
- task creation/editing,
- sequential tasks,
- quiz,
- photo,
- video,
- automatic scoring,
- TOP 10,
- Big Screen ranking,
- coordinator magic link,
- coordinator QR,
- coordinator special events,
- live gallery,
- basic final report,
- media cleanup.

### Should Have

- AI task generator,
- achievements,
- Summary View,
- AI Event Summary,
- media ZIP export,
- anti-spam cooldown.

### Could Have

- advanced animations,
- multiple themes,
- advanced achievement rules,
- offline mode,
- advanced moderation.

### Not MVP

- AI Vision,
- face recognition,
- native mobile app,
- full offline-first,
- microservices,
- unlimited scaling guarantees,
- advanced admin panel.

## Post-MVP Direction

The PRD and Architecture identify offline-first as a future capability.

Future offline support may include:

- local task cache,
- local submission queue,
- temporary IDs,
- synchronization,
- conflict resolution,
- upload retry.

This roadmap does not schedule those capabilities into MVP.
