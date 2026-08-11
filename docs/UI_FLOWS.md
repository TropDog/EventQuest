# EventQuest — UI Flows

## Purpose

This document translates the documented EventQuest user journeys into implementation-oriented UI flows.

The three primary actors are:

- Organizer
- Coordinator
- Player

The flows are based on the PRD and Architecture. They describe navigation, states, actions and expected outcomes without inventing undocumented product rules.

---

# 1. Product Entry Model

EventQuest is browser-based and mobile-first.

Players do not install a native application and join through:

- QR code,
- link,
- room code.

The organizer uses a registered account.

The coordinator uses dedicated event access without registration.

---

# 2. Organizer Flow

## 2.1 Registration

```text
Landing
  ↓
Register
  ↓
Enter email + password
  ↓
Accept required terms
  ↓
Create account
  ↓
Organizer Dashboard
```

### States

- empty form
- validation error
- duplicate/invalid account error
- registration success

### Success

Organizer is authenticated and can access their dashboard.

---

## 2.2 Login

```text
Login
  ↓
Email + password
  ↓
Authenticate
  ↓
Organizer Dashboard
```

### Error states

- invalid credentials
- missing fields
- expired/invalid session

---

## 2.3 Organizer Dashboard

The dashboard should expose the organizer's event context and available package/event actions.

Conceptual structure:

```text
Dashboard
├── Events
├── Packages / Purchases
└── Account
```

The organizer must only see events they own.

---

## 2.4 Package Purchase

```text
Dashboard
  ↓
Packages
  ↓
Select package
  ↓
Checkout
  ↓
Payment provider / placeholder
  ↓
Payment confirmation
  ↓
Package available
```

### Important rule

```text
1 package purchase
=
1 event
=
1 room
```

The package configuration determines the participant limit.

---

## 2.5 Create Event

```text
Dashboard
  ↓
Create Event
  ↓
Select available package
  ↓
Enter event configuration
  ↓
Create
  ↓
Event created
  ↓
Event configuration screen
```

### Event states

```text
DRAFT
CONFIGURED
ACTIVE
CLOSED
ARCHIVED
```

The organizer should be able to understand the current event state at all times.

---

## 2.6 Configure Event

Conceptual flow:

```text
Event
  ↓
General Settings
  ↓
Game Mode
  ├── Solo
  └── Teams
        ↓
      Team setup
  ↓
Tasks
  ↓
Ready to open
```

The exact event settings exposed in UI must follow the feature/module specifications.

---

## 2.7 Configure Teams

Only relevant for team mode.

```text
Event Settings
  ↓
Teams
  ↓
Create/configure teams
  ↓
Set team capacity
  ↓
Save
```

Players later see only teams belonging to the same event.

---

## 2.8 Configure Tasks

```text
Event
  ↓
Tasks
  ↓
Create task
  ↓
Select type
  ↓
Configure task
  ↓
Save
```

Supported task types:

```text
QUIZ
PHOTO
VIDEO
TEXT
GROUP
TIMED
```

Task configuration may include:

- title/name,
- description,
- points,
- time limit,
- submission limit,
- solo/team mode,
- activation/deactivation,
- evidence requirement.

---

## 2.9 AI Task Generation

Priority: SHOULD HAVE.

```text
Tasks
  ↓
Generate with AI
  ↓
Enter generation parameters
  ↓
Generate suggestions
  ↓
Review
  ↓
Edit
  ↓
Approve
  ↓
Publish tasks
```

Generation context can include:

```text
event_type
participant_count
age_range
task_count
party_style
energy_level
game_mode
```

### Critical rule

AI output is never automatically published.

The organizer must review/approve/edit generated tasks before they become playable.

---

## 2.10 Event Opening

```text
Configured Event
  ↓
Open Event
  ↓
ACTIVE
  ↓
Display:
  - room code
  - QR code
```

The QR code is the primary player entry mechanism.

---

## 2.11 Event Monitoring

During an active event the organizer can access the event's documented organizer views.

Conceptually:

```text
Active Event
├── Live ranking
├── Players
├── Tasks
├── Gallery
├── Event status
└── Summary/report after closure
```

The exact permissions and UI details belong to the corresponding feature specifications.

---

## 2.12 Close Event

```text
Active Event
  ↓
Close Event
  ↓
CLOSED
  ↓
Gameplay ends
  ↓
Report can be generated
```

The event may also close automatically according to the documented event lifecycle.

---

## 2.13 Final Report

```text
Closed Event
  ↓
Generate Report
  ↓
Background processing
  ↓
Report ready
  ↓
Download
```

The report can contain relevant:

- rankings,
- submissions,
- media,
- achievements,
- special events,
- statistics,
- AI-generated summary where enabled.

---

# 3. Coordinator Flow

## 3.1 Access

Coordinator has no account.

```text
Coordinator Link
  ↓
Validate access token
  ↓
Coordinator Event Context
```

If token is:

- invalid,
- expired,
- revoked,

access is denied.

---

## 3.2 Coordinator Home

Conceptual structure:

```text
Coordinator Event
├── QR / Room Code
├── Ranking
├── Special Events
├── Gallery
├── Big Screen
└── Summary
```

Coordinator must not receive organizer-only functionality such as:

- package purchase,
- event creation,
- event deletion,
- payment management,
- final report download.

---

## 3.3 Display QR / Room Code

```text
Coordinator
  ↓
QR / Room Code
  ↓
Fullscreen presentation
```

Purpose:

Guests can scan/join the event.

---

## 3.4 Start Special Event

```text
Coordinator
  ↓
Special Events
  ↓
Select event type
  ↓
Start
  ↓
Realtime broadcast
  ↓
Players / Big Screen update
```

Supported types:

```text
Happy Hour
Flash Quest
Golden Quest
Team Challenge
```

---

## 3.5 Big Screen Mode

```text
Coordinator
  ↓
Big Screen
  ↓
Fullscreen
```

Big Screen can present:

- live ranking,
- event alerts,
- new challenge,
- round summary,
- live gallery,
- summary view.

Realtime updates are delivered through WebSockets.

---

# 4. Player Flow

## 4.1 Join via QR

```text
Scan QR
  ↓
Browser opens EventQuest
  ↓
Resolve room/event
  ↓
Join screen
```

Equivalent entry methods:

```text
QR
Link
Room Code
```

---

## 4.2 Join Validation

```text
Join
  ↓
Validate event
  ↓
Check event availability
  ↓
Check participant limit
  ↓
Terms
```

If the event cannot accept the player, the UI should show a clear error instead of entering gameplay.

---

## 4.3 Accept Terms

```text
Join
  ↓
Terms
  ↓
Accept
  ↓
Continue
```

Acceptance is required before entering the game.

---

## 4.4 Choose Nickname

```text
Terms accepted
  ↓
Nickname
  ↓
Enter nickname
  ↓
Continue
```

Nickname is part of player identity.

### Rule

The nickname cannot be changed after joining.

---

## 4.5 Avatar

```text
Nickname
  ↓
Avatar (optional)
  ↓
Continue
```

Avatar selection is optional.

---

## 4.6 Team Selection

Only shown in team mode.

```text
Join
  ↓
Team selection
  ↓
Available teams
  ↓
Select team
  ↓
Continue
```

A full team cannot be selected/joined.

---

## 4.7 Enter Game

```text
Join completed
  ↓
Player session created
  ↓
Current Task
```

Player does not create an account.

---

# 5. Player Gameplay Flow

## 5.1 Task Screen

The player sees:

```text
Current Task
├── title
├── description
├── task type
├── points
├── timer where applicable
└── submission action
```

The player may also see:

```text
Next task teaser
Remaining task count
```

The player must not browse the complete future task list.

---

## 5.2 Quiz Task

```text
Quiz
  ↓
Select answer
  ↓
Submit
  ↓
Backend validates
  ↓
Score transaction if correct
  ↓
Next task / current state
```

The frontend does not decide whether the answer is correct.

---

## 5.3 Text Task

```text
Text Task
  ↓
Enter response
  ↓
Submit
  ↓
Backend validates submission
  ↓
Submission accepted/rejected
```

---

## 5.4 Photo Task

```text
Photo Task
  ↓
Capture/select photo
  ↓
Request signed upload URL
  ↓
Upload directly to storage
  ↓
Confirm upload
  ↓
Submission recorded
  ↓
Scoring / realtime update
```

MVP photo limits:

```text
15 MB
jpg / jpeg / png / webp
```

---

## 5.5 Video Task

```text
Video Task
  ↓
Record/select video
  ↓
Request signed upload URL
  ↓
Upload directly to storage
  ↓
Confirm upload
  ↓
Submission recorded
  ↓
Scoring / realtime update
```

MVP video limits:

```text
100 MB
30 seconds
mp4 / mov / webm
```

---

# 6. Ranking Flow

## Player Ranking

```text
Gameplay
  ↓
Score changes
  ↓
Backend updates ranking
  ↓
RANKING_UPDATED
  ↓
Player ranking view updates
```

Player sees:

- own score,
- own position,
- TOP 10.

In team mode, team score/ranking is also available where applicable.

---

# 7. Realtime UI Flow

## Connection

```text
Event context
  ↓
Connect WebSocket
  ↓
Join event-specific channel
```

Channels:

```text
event:{eventId}:players
event:{eventId}:coordinator
event:{eventId}:big-screen
event:{eventId}:organizer
```

## Realtime Events

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

### UI principle

Realtime events update presentation/state.

The backend remains the source of truth.

---

# 8. Gallery Flow

```text
Player uploads media
  ↓
Storage upload
  ↓
Backend confirms metadata
  ↓
MEDIA_UPLOADED
  ↓
Gallery refresh/update
```

Gallery:

- event-scoped,
- newest first,
- optionally filtered by task.

---

# 9. Achievement Flow

Priority: SHOULD HAVE.

```text
Player completes qualifying action
  ↓
Backend evaluates achievement
  ↓
Achievement awarded
  ↓
ACHIEVEMENT_UNLOCKED
  ↓
Player UI / relevant views update
```

Achievements do not modify ranking position.

---

# 10. Event Closure Flow

```text
ACTIVE
  ↓
Close event
  ↓
CLOSED
  ↓
Stop normal gameplay
  ↓
Finalize event statistics
  ↓
Report available for generation
```

Realtime:

```text
EVENT_CLOSED
```

is published to connected clients.

---

# 11. Report & Retention Flow

```text
CLOSED
  ↓
Generate report
  ↓
Collect event data
  ├── ranking
  ├── submissions
  ├── media
  ├── achievements
  └── special events
  ↓
Optional AI summary
  ↓
Create report/media package
  ↓
Organizer downloads
  ↓
Cleanup job
  ↓
Multimedia deleted
```

Maximum multimedia retention:

```text
30 days
```

Logs/statistics remain.

---

# 12. Error-State Principles

The UI should clearly handle:

- invalid/expired access token,
- invalid room code,
- closed event,
- participant limit reached,
- unauthorized action,
- task no longer active,
- submission limit reached,
- anti-spam cooldown,
- invalid media type,
- media too large,
- video too long,
- upload failure,
- WebSocket disconnect,
- unavailable network.

MVP is online-only.

For temporary connection problems, provide clear retry behavior where applicable.

Full offline-first behavior is not part of MVP.

---

# 13. Responsive Priority

The primary player interface is mobile-first.

The primary coordinator/Big Screen experience may use larger displays.

Therefore:

```text
Player
→ mobile-first

Organizer
→ desktop-friendly management UI

Coordinator
→ desktop/tablet/large-screen friendly

Big Screen
→ fullscreen large-display UI
```

---

# 14. UI State Ownership

The frontend may maintain:

- current view state,
- form state,
- upload progress,
- temporary presentation state,
- connection state.

The backend owns:

- event status,
- player identity/session,
- task activation,
- submission validity,
- score,
- ranking,
- special-event state.

Never turn frontend state into an alternative business source of truth.
