# EventQuest — Project Overview

## Purpose

EventQuest is a SaaS / Event Engagement Platform designed to turn weddings, parties and events into interactive games based on tasks, points, rankings and cooperation.

The product tagline is:

> Kahoot dla wesel, imprez i eventów

The core experience is browser-based and mobile-first. Participants join an event through a QR code, link or room code, complete tasks, submit photos/videos/answers, earn points and follow the live ranking. The organizer receives an event gallery and a final summary.

## Product Roles

EventQuest has three roles.

### Organizer

The organizer owns the event and has a registered account.

The organizer can:

- register and log in,
- purchase packages,
- create events,
- configure events,
- create and edit tasks,
- manage teams,
- monitor gameplay,
- view the gallery,
- download reports,
- close events,
- invite coordinators,
- use coordinator functionality.

Authentication:

- email + password,
- JWT access token,
- refresh token.

### Coordinator

The coordinator is typically a DJ, host, MC or animator.

The coordinator does not create an account. Access is provided through a dedicated link / magic-link token associated with one event.

The coordinator can:

- display the player QR code,
- display the room code,
- start special events,
- use Big Screen Mode,
- view rankings,
- view the gallery,
- use Summary View,
- publish messages.

The coordinator cannot:

- purchase packages,
- create events,
- delete events,
- download final reports,
- manage payments,
- change business settings.

### Player

The player is a guest and does not create an account.

The player joins through:

- QR code,
- link,
- room code.

The player:

- accepts the terms,
- chooses a nickname,
- may choose an avatar,
- may choose a team in team mode,
- completes tasks,
- submits photos and videos,
- earns points,
- earns achievements,
- views the ranking.

The nickname cannot be changed after joining. A nickname change is treated as a new participant.

## Business Model

The core business rule is:

**1 package purchase = 1 event = 1 room**

Package tiers defined in the PRD:

- Free: up to 20 participants
- Basic: up to 60 participants
- Premium: up to 100 participants
- Unlimited: no participant limit

Participant limits are business rules and must not become hard technical limits of the architecture.

## Event Lifecycle

The event lifecycle is:

```text
Package purchase
    ↓
Event creation
    ↓
Event configuration
    ↓
Task configuration
    ↓
Room publication
    ↓
Active gameplay
    ↓
Event closure
    ↓
Summary / report generation
```

Architecture defines event statuses:

```text
DRAFT
CONFIGURED
ACTIVE
CLOSED
ARCHIVED
```

The default automatic closing date is seven days after the start date.

## Game Modes

### Solo

Players compete individually.

### Teams

The organizer configures:

- number of teams,
- maximum team size.

Players select an available team when joining.

A team becomes unavailable after reaching its player limit.

Each team can change its name once.

## Task System

Supported task types:

- QUIZ
- PHOTO
- VIDEO
- TEXT
- GROUP
- TIMED

Tasks are executed sequentially.

The player sees:

- the current task in full,
- a teaser of the next task,
- only the number of remaining tasks.

Task properties include:

- name/title,
- description,
- type,
- points,
- optional time limit,
- optional submission limit,
- solo/team mode,
- activation/deactivation timing,
- optional evidence requirement.

## Scoring and Ranking

Scoring is performed automatically when the technical conditions of a task are met.

Quiz tasks award points only for correct answers.

The backend is the source of truth for:

- scoring,
- ranking,
- task state.

The frontend must never calculate final points.

The player sees:

- own position,
- own score,
- TOP 10,
- team score where applicable.

The player does not see detailed activity history or detailed personal data of other participants.

Ranking is a primary motivation mechanism of the product.

## Achievements

Achievements support engagement but do not change ranking position.

Examples defined in the product documentation:

- Pierwsze Zadanie
- Król Selfie
- Pogromca Quizów
- Team Player
- Nocny Marek
- Mistrz Integracji
- Łowca Flash Questów

## Special Events

Special events are started by the coordinator.

Defined types:

- Happy Hour — double points
- Flash Quest — sudden additional task
- Golden Quest — highly scored task
- Team Challenge — team challenge

Special events are communicated through realtime updates and can affect scoring during their active period.

## Media

Players can submit photos and videos.

Media upload uses direct-to-object-storage upload:

```text
Frontend
  ↓
Backend requests/returns signed upload URL
  ↓
Object Storage
  ↓
Frontend confirms upload
  ↓
Backend stores metadata
```

Binary media should not pass through the backend when avoidable.

MVP media limits specified by the architecture:

- photo: max 15 MB
- video: max 100 MB
- video duration: max 30 seconds
- photos: jpg, jpeg, png, webp
- videos: mp4, mov, webm

## Realtime

Each event has its own realtime channels.

Defined channels:

```text
event:{eventId}:players
event:{eventId}:coordinator
event:{eventId}:big-screen
event:{eventId}:organizer
```

Realtime events include:

- RANKING_UPDATED
- TASK_UNLOCKED
- SPECIAL_EVENT_STARTED
- SPECIAL_EVENT_ENDED
- MEDIA_UPLOADED
- ACHIEVEMENT_UNLOCKED
- ANNOUNCEMENT_PUBLISHED
- EVENT_CLOSED

The backend is the only source of truth.

## Big Screen Mode

Big Screen Mode is intended for:

- TV,
- projector,
- LED screen,
- screen sharing.

It supports:

- live ranking,
- event alerts,
- new challenge presentation,
- round summary,
- live gallery,
- summary view.

It must be readable from a large display, support fullscreen use and update through WebSockets.

## AI

AI is used for:

### Task Generator

Inputs include:

- event type,
- participant count,
- age range,
- task count,
- party style,
- energy level,
- game mode.

Outputs include:

- task suggestions,
- special-event suggestions,
- point suggestions.

The organizer must approve and may edit AI-generated tasks before publication.

### AI Event Summary

Generated after the event.

The summary can include:

- narrative summary,
- most active players,
- most popular tasks,
- team summary,
- interesting statistics.

AI must not perform face recognition or identify people in photos.

AI Vision is explicitly outside the MVP.

## Data Retention

Multimedia retention is:

- maximum 30 days,
- or earlier deletion after report generation and download.

The system keeps:

- logs,
- technical logs,
- statistics,
- ranking summaries,
- task statistics,
- score transactions.

Cleanup is performed by scheduled jobs.

## Security Model

Organizer:

- email/password,
- JWT access token,
- server-tracked refresh token,
- refresh token stored only as a hash,
- refresh token expiry and revocation,
- unique email,
- access limited to owned events.

Coordinator:

- magic-link/access token,
- token stored as hash,
- token tied to one event.

Player:

- guest session token,
- token tied to player and event,
- access limited to own event/session.

Passwords must be hashed using bcrypt or argon2.

Storage administration credentials must never reach the frontend.

Every endpoint must validate relevant:

- actor type,
- event access,
- role permissions,
- event status,
- package limits.

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- PWA capabilities

### Backend

- NestJS
- TypeScript
- REST API
- WebSocket Gateway

### Database

- PostgreSQL
- Prisma ORM

### Media Storage

S3-compatible object storage.

Possible providers described in the architecture:

- AWS S3
- Azure Blob Storage
- Cloudflare R2

### Async Processing

- Redis
- BullMQ

### Payments

Stripe initially.

Future Polish providers may include Przelewy24, PayU or Tpay.

### AI

OpenAI API or Azure OpenAI.

## Architecture Style

The MVP uses:

**Modular Monolith + PostgreSQL + Object Storage + Real-Time Gateway**

Microservices are not part of the MVP architecture.

The modular monolith should preserve clear domain boundaries so that high-load areas can be separated later if necessary.

## MVP Scope

### Must Have

- organizer registration/login,
- package selection/payment placeholder or integration,
- event creation,
- room code and QR generation,
- solo/team mode,
- teams,
- player join flow,
- terms acceptance,
- nickname,
- task creation/editing,
- sequential tasks,
- quiz submissions,
- photo submissions,
- video submissions,
- automatic scoring,
- TOP 10 ranking,
- Big Screen ranking,
- coordinator magic link,
- coordinator QR display,
- coordinator special events,
- live gallery,
- basic final report,
- media retention cleanup.

### Should Have

- AI task generator,
- achievements,
- Summary View,
- AI Event Summary,
- media ZIP export,
- anti-spam cooldown.

### Could Have

- advanced animations,
- multiple visual themes,
- advanced achievement rules,
- offline mode,
- advanced moderation.

### Explicitly Not MVP

- AI Vision,
- face recognition,
- native mobile application,
- full offline-first,
- microservices,
- unlimited scaling guarantees,
- advanced admin panel.

## Future Direction

Offline-first is a future capability, not MVP scope. The architecture should not block future synchronization, but MVP should remain online-only with clear offline errors and upload retry behavior.

## Source Documents

This document is a condensed AI-oriented overview derived from:

- `PRD.md`
- `architecture.md`

Those source documents remain the primary product and architecture references. This overview should not silently override them.
