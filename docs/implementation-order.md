# EventQuest — Implementation Order

This document defines the recommended implementation dependency order for AI-assisted development.

The order is based on the architecture's module dependencies, domain model, system flows and explicit recommended AI-development sequence.

## Phase 0 — Repository and Project Foundation

Before implementing business modules:

- initialize repository structure,
- initialize frontend application,
- initialize backend application,
- configure TypeScript,
- configure environment handling,
- configure shared package,
- configure PostgreSQL,
- configure Prisma,
- configure basic testing/linting,
- establish common backend infrastructure.

Do not implement large product features before the project foundation is stable.

## Phase 1 — Domain Foundation

Create and validate the domain model for:

- OrganizerAccount,
- PackagePurchase,
- Event,
- CoordinatorAccess,
- Player,
- Team,
- Task,
- TaskSubmission,
- MediaAsset,
- ScoreTransaction,
- RankingSnapshot,
- Achievement,
- PlayerAchievement,
- SpecialEvent,
- AiGeneratedTaskSet,
- EventSummary,
- AuditLog.

Then define:

- relationships,
- statuses,
- enums,
- constraints,
- indexes.

This phase corresponds to the architecture's recommended Domain Model → ERD step.

## Phase 2 — Authentication and Access

Implement:

1. organizer registration,
2. organizer login,
3. organizer refresh-token persistence and issuance,
4. organizer refresh-token validation,
5. organizer logout and refresh-token revocation,
6. organizer identity,
7. organizer authorization,
8. coordinator access tokens,
9. player guest sessions.

Access must be established before protected business flows are implemented.

Organizer refresh-token persistence is a documented domain requirement and must use the `OrganizerRefreshToken` model defined in `DOMAIN_MODEL.md` / `ERD.md`.

## Phase 3 — Packages and Payments

Implement:

1. package listing,
2. package purchase model,
3. checkout flow,
4. payment webhook,
5. paid package validation,
6. package usage,
7. participant limit validation.

Core business rule:

```text
1 package purchase = 1 event = 1 room
```

## Phase 4 — Events

Implement:

1. event creation,
2. event configuration,
3. event status lifecycle,
4. room code generation,
5. event QR generation,
6. event opening,
7. event closing,
8. event ownership/access.

Event lifecycle:

```text
DRAFT
→ CONFIGURED
→ ACTIVE
→ CLOSED
→ ARCHIVED
```

## Phase 5 — Teams and Players

Implement:

1. room join validation,
2. terms acceptance,
3. nickname,
4. guest session,
5. player creation,
6. team listing,
7. team joining,
8. team capacity,
9. one-time team-name change,
10. player/team access rules.

The player join flow must work before gameplay can be implemented.

## Phase 6 — Tasks

Implement:

1. task model,
2. task creation,
3. task editing,
4. task deletion,
5. task ordering,
6. sequential activation,
7. current task,
8. next-task teaser,
9. remaining-task count,
10. task limits/time windows.

AI task generation should be treated as a later feature of the task module, not as a prerequisite for basic task gameplay.

## Phase 7 — Submissions

Implement task submissions by type.

Recommended order:

1. text,
2. quiz,
3. photo,
4. video,
5. group,
6. timed.

Every submission must validate:

- player session,
- event,
- active task,
- submission limits,
- anti-spam rules where applicable.

## Phase 8 — Scoring

Implement:

1. points for valid submissions,
2. quiz correctness,
3. score transactions,
4. solo scoring,
5. team scoring,
6. special-event multipliers/bonuses,
7. scoring history.

Scoring remains server-side.

## Phase 9 — Ranking

Implement:

1. player ranking,
2. TOP 10,
3. player's own position,
4. team ranking,
5. ranking snapshots where needed.

Ranking must consume authoritative server-side scoring.

## Phase 10 — Realtime

Implement:

- event-specific WebSocket channels,
- ranking updates,
- task unlock events,
- special-event events,
- media upload events,
- achievement events,
- announcements,
- event closure.

Realtime should be connected after the underlying state-changing modules exist.

## Phase 11 — Coordinator and Big Screen

Implement:

1. coordinator panel,
2. coordinator authorization,
3. QR display,
4. room-code display,
5. special-event controls,
6. ranking view,
7. gallery view,
8. Big Screen Mode,
9. event alerts,
10. challenge view,
11. summary view.

## Phase 12 — Media and Gallery

Implement:

1. signed upload URL,
2. direct object-storage upload,
3. upload confirmation,
4. MediaAsset metadata,
5. gallery,
6. task filtering,
7. media preview.

The architecture treats media as a major scalability concern, so the direct-to-storage flow must remain intact.

## Phase 13 — Achievements and Special Events

Implement:

- achievement definitions,
- achievement awarding,
- player achievement display,
- summary presentation,
- Happy Hour,
- Flash Quest,
- Golden Quest,
- Team Challenge.

## Phase 14 — AI Features

Implement after core gameplay works:

### AI Task Generator

Input:

- event type,
- participant count,
- age range,
- task count,
- party style,
- energy level,
- game mode.

Output:

- tasks,
- special-event suggestions,
- point suggestions.

Organizer approval/editing is mandatory.

### AI Event Summary

Generate after event closure using event metadata and gameplay statistics.

No face identification.

## Phase 15 — Reports

Implement:

1. report request,
2. background report job,
3. collection of rankings/submissions/media metadata/achievements/special events,
4. AI summary,
5. media package,
6. report generation,
7. download.

## Phase 16 — Retention and Cleanup

Implement:

- cleanupExpiredMediaJob,
- cleanupDownloadedReportMediaJob,
- archiveClosedEventsJob,
- deleteRevokedCoordinatorTokensJob.

Verify the 30-day multimedia retention rule.

## Phase 17 — MVP Hardening

Before considering MVP complete:

- security review,
- authorization review,
- upload validation,
- anti-spam validation,
- database indexes,
- realtime reliability,
- report job reliability,
- cleanup reliability,
- mobile-first UX,
- error handling,
- tests,
- build verification.

## Dependency Principle

Do not implement a module before its required domain dependencies are available.

Examples:

```text
Player gameplay
requires Event + Player + Task

Scoring
requires Task + Submission + Player

Ranking
requires Scoring

Realtime ranking
requires Ranking + WebSocket infrastructure

Final report
requires gameplay data + ranking + media + achievements
```

## Source-of-Truth Rule

The implementation order is a development plan derived from PRD and Architecture.

If the source documents change, this plan must be reviewed and updated.
