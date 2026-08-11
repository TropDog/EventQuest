# EventQuest — Domain Model

## Purpose

This document defines the logical domain model used by EventQuest.

It is derived from the PRD and Architecture Document and is intended as an implementation reference for AI coding agents.

The model describes entities, relationships, statuses, enums and explicit business rules. It is not a replacement for the original PRD or Architecture.

---

## 1. Core Entities

The Architecture defines these primary domain entities:

- `OrganizerAccount`
- `PackagePurchase`
- `Event`
- `CoordinatorAccess`
- `Player`
- `Team`
- `Task`
- `TaskSubmission`
- `MediaAsset`
- `ScoreTransaction`
- `RankingSnapshot`
- `Achievement`
- `PlayerAchievement`
- `SpecialEvent`
- `AiGeneratedTaskSet`
- `EventSummary`
- `AuditLog`

---

## 2. OrganizerAccount

Represents a registered EventQuest organizer.

### Responsibilities

- authenticate the organizer,
- own events,
- own package purchases,
- access reports and summaries.

### Fields

```text
id
email
password_hash
terms_accepted_at
created_at
updated_at
```

### Rules

- Organizer is the only registered user role.
- Email + password authentication is used.
- `email` is unique at the database level; duplicate registration must be rejected consistently.
- Email addresses are normalized to lowercase for storage and lookup so duplicate detection is case-insensitive.
- Passwords must never be stored in plaintext.
- Organizer can access only events belonging to that organizer.
- Organizer authentication uses a JWT access token and a refresh-token session.
- Refresh tokens are persisted as hashes in `OrganizerRefreshToken`.
- A refresh token has an expiry and can be revoked server-side.

---

## 3. OrganizerRefreshToken

Represents a server-tracked organizer refresh-token session.

### Fields

```text
id
organizer_id
token_hash
expires_at
revoked_at
created_at
```

### Rules

- Each refresh-token record belongs to exactly one organizer.
- Only the hash of the refresh token is persisted.
- The raw refresh token must never be stored in the database.
- An expired refresh token is rejected.
- A revoked refresh token is rejected.
- Logout revokes the refresh-token session presented for that logout operation.
- Refresh-token persistence is required so the backend can reject revoked refresh tokens.
- The exact refresh-token transport/DTO shape remains an API-level implementation detail unless explicitly defined elsewhere.

---

## 3. PackagePurchase

Represents a purchased package that can be used to create one event.

### Fields

```text
id
organizer_id
package_type
participant_limit
payment_status
payment_provider
payment_provider_session_id
purchased_at
used_at
created_at
```

### Rules

```text
1 package purchase = 1 event = 1 room
```

A paid package can be used to create exactly one event.

Package participant limits are business configuration, not hardcoded technical limits.

---

## 4. Event

Represents one playable EventQuest event.

### Fields

```text
id
organizer_id
package_purchase_id
name
event_type
room_code
status
game_mode
participant_limit
starts_at
closes_at
closed_at
created_at
updated_at
```

### Statuses

```text
DRAFT
CONFIGURED
ACTIVE
CLOSED
ARCHIVED
```

### Game modes

The PRD defines:

```text
SOLO
TEAMS
```

### Rules

- Event belongs to one organizer.
- Event uses one package purchase.
- Event has one room code.
- Event can have many players, teams and tasks.
- Event can be closed manually or automatically.
- Default automatic closing is start date + 7 days.
- Event ownership must be enforced server-side.

---

## 5. CoordinatorAccess

Represents token-based access for a coordinator.

### Fields

```text
id
event_id
token_hash
is_active
expires_at
revoked_at
created_at
```

### Rules

- Coordinator has no account.
- Access is tied to exactly one event.
- Token is stored as a hash.
- Access may expire.
- Organizer can revoke access.
- Coordinator can operate event-management/hosting features permitted by the PRD.
- Coordinator cannot purchase packages, create/delete events, manage payments or download the final report.

---

## 6. Player

Represents a guest participant.

### Fields

```text
id
event_id
team_id
nickname
avatar_url
guest_token_hash
terms_accepted_at
joined_at
last_seen_at
created_at
```

### Rules

- Player has no registered account.
- Player joins through QR, link or room code.
- Terms acceptance is mandatory.
- Nickname is required.
- Avatar is optional.
- Guest session token is stored as a hash.
- Nickname cannot be changed after joining.
- A nickname change is treated as a new player.
- Player operations are restricted to the player's event/session.

---

## 7. Team

Represents a team in team game mode.

### Fields

```text
id
event_id
name
default_number
max_players
name_changed
created_at
updated_at
```

### Rules

- Team belongs to one event.
- Team has a maximum player count.
- A full team cannot accept another player.
- Team name can be changed at most once.
- After the allowed change, the name becomes final.
- Team mode is optional; solo mode does not require teams.

---

## 8. Task

Represents a challenge available during an event.

### Fields

```text
id
event_id
sequence_number
title
description
teaser
task_type
points
is_active
activation_strategy
time_limit_seconds
max_submissions_per_player
starts_at
ends_at
created_at
updated_at
```

### Task types

```text
QUIZ
PHOTO
VIDEO
TEXT
GROUP
TIMED
```

### Rules

- Task belongs to one event.
- Tasks have a sequence.
- Tasks are normally revealed sequentially.
- Current task is fully visible.
- Next task can expose a teaser.
- Remaining tasks are represented by a count.
- Task can have a time limit.
- Task can limit submissions per player.
- AI-generated tasks must be reviewable/editable before publication.

---

## 9. TaskSubmission

Represents a player's attempt/submission for a task.

### Fields

```text
id
event_id
task_id
player_id
team_id
submission_type
text_answer
quiz_answer
is_correct
status
points_awarded
submitted_at
created_at
```

### Rules

- Submission belongs to one event, task and player.
- Team is optional depending on game mode.
- Submission type must match task type.
- Quiz points are awarded only for correct answers.
- Submission limits and anti-spam rules are validated by backend.
- Submission state must not be trusted from the frontend.

---

## 10. MediaAsset

Represents uploaded photo/video metadata.

### Fields

```text
id
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

### Rules

- Media belongs to an event.
- Media may be associated with a task submission.
- Binary files are stored in object storage.
- Backend stores metadata/storage keys.
- Direct-to-storage upload is preferred.
- Media retention is maximum 30 days.
- Media can be deleted earlier after report generation and download.

### MVP limits

```text
Photo: 15 MB
Video: 100 MB
Video duration: 30 seconds
```

---

## 11. ScoreTransaction

Represents an individual scoring change.

### Fields

```text
id
event_id
player_id
team_id
task_submission_id
special_event_id
points
reason
created_at
```

### Rules

- Scoring is server-side.
- Every scoring change should be represented as a transaction.
- A transaction may be related to a player, team, task submission or special event.
- Special-event multipliers/bonuses can affect scoring.
- Score history remains available after media deletion.

---

## 12. RankingSnapshot

Represents a persisted/cached representation of ranking state where required.

The Architecture identifies `RankingSnapshot` as a domain entity and recommends ranking snapshot caching for scalability.

### Responsibilities

- support efficient ranking reads,
- support Big Screen ranking,
- reduce expensive repeated ranking calculations for large events.

The exact physical schema is intentionally left for ERD/implementation decisions.

---

## 13. Achievement

Represents a reusable achievement definition.

### Fields

```text
id
code
name
description
icon
created_at
```

### Examples

```text
Pierwsze Zadanie
Król Selfie
Pogromca Quizów
Team Player
Nocny Marek
Mistrz Integracji
Łowca Flash Questów
```

Achievements do not affect ranking position.

---

## 14. PlayerAchievement

Represents an achievement awarded to a player.

### Fields

```text
id
event_id
player_id
achievement_id
awarded_at
```

### Rules

- Award belongs to one event and one player.
- Achievement definition is reusable.
- Achievement affects engagement but not ranking score.

---

## 15. SpecialEvent

Represents an event-wide gameplay modifier or additional challenge.

### Fields

```text
id
event_id
type
title
description
multiplier
starts_at
ends_at
created_by_coordinator_access_id
created_by_organizer_id
created_at
```

### Types

```text
HAPPY_HOUR
FLASH_QUEST
GOLDEN_QUEST
TEAM_CHALLENGE
```

### Rules

- Special events belong to one Event.
- They may be created by coordinator or organizer.
- They have an active time window.
- They are published through realtime.
- Their scoring effect applies during the configured period.

---

## 16. AiGeneratedTaskSet

Represents a set of tasks produced by the AI task generator.

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

### Rules

- AI output is a suggestion.
- Organizer must approve/edit tasks before publication.
- AI does not validate submitted media in MVP.

---

## 17. EventSummary

Represents the final event summary/report data.

### Fields

```text
id
event_id
ai_summary_text
report_url
media_package_url
generated_at
downloaded_at
created_at
```

### Summary content

May include:

- narrative summary,
- most active players,
- most popular tasks,
- team summary,
- interesting statistics.

AI must not identify people or analyze faces in event photos.

---

## 18. AuditLog

Represents an auditable system action.

### Fields

```text
id
event_id
actor_type
actor_id
action
metadata_json
created_at
```

### Rules

Anti-spam blocks and other relevant security/system actions must leave an audit trail.

---

# 19. Relationships

The Architecture defines these relationships:

```text
OrganizerAccount 1 ── N PackagePurchase
OrganizerAccount 1 ── N Event

PackagePurchase 1 ── 1 Event

Event 1 ── N CoordinatorAccess
Event 1 ── N Player
Event 1 ── N Team
Event 1 ── N Task
Event 1 ── N SpecialEvent
Event 1 ── N MediaAsset
Event 1 ── N AuditLog

Team 1 ── N Player

Task 1 ── N TaskSubmission
Player 1 ── N TaskSubmission

TaskSubmission 0 ── N MediaAsset

Player 1 ── N ScoreTransaction
Team 1 ── N ScoreTransaction

Player 1 ── N PlayerAchievement
Achievement 1 ── N PlayerAchievement

Event 1 ── 1 EventSummary
```

Additional direct foreign-key relationships are represented by the entity fields above.

---

# 20. Domain Invariants

These rules are especially important for implementation.

### Access

- Organizer owns events.
- Coordinator access belongs to one event.
- Player session belongs to one player/event context.

### Package

- One purchase creates one event.
- One event consumes one purchased package.

### Player

- No account.
- Terms required.
- Nickname required.
- Nickname immutable after joining.

### Teams

- Team belongs to event.
- Team has capacity.
- Team name can change once.

### Tasks

- Tasks belong to event.
- Tasks are sequential.
- Submission type must match task type.

### Scoring

- Backend is authoritative.
- Frontend never calculates final score.

### Media

- Direct-to-storage upload.
- Backend stores metadata.
- Maximum retention 30 days.

### AI

- AI suggestions require organizer approval.
- No AI Vision in MVP.
- No face recognition.

### Realtime

- Event-specific channels.
- Backend is source of truth.

---

# 21. Domain State vs Presentation State

The following are authoritative domain state:

- event status,
- player/session validity,
- task activation,
- submission validity,
- score transactions,
- ranking state,
- special-event state.

The following are presentation concerns:

- Big Screen layout,
- ranking animations,
- task teaser presentation,
- gallery layout.

Frontend presentation must not become an alternative source of business truth.
