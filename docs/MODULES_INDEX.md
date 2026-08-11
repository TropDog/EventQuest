# EventQuest — Module Documentation Index

## Purpose

This directory contains module-level implementation documentation for the EventQuest modular monolith.

The module documents are derived from the PRD and Architecture and are intended to be read by Cursor/Claude Code before implementing the corresponding module.

## Modules

1. [Auth](./auth.md)
2. [Packages & Payments](./packages-payments.md)
3. [Events](./events.md)
4. [Coordinator](./coordinator.md)
5. [Players](./players.md)
6. [Teams](./teams.md)
7. [Tasks](./tasks.md)
8. [Submissions](./submissions.md)
9. [Scoring](./scoring.md)
10. [Ranking](./ranking.md)
11. [Achievements](./achievements.md)
12. [Special Events](./special-events.md)
13. [Media](./media.md)
14. [AI](./ai.md)
15. [Reports](./reports.md)
16. [Retention](./retention.md)
17. [Realtime](./realtime.md)

## Module Structure

Each module should normally contain:

```text
controller
service
repository
dto
entity/model
guards/policies
tests
```

This structure follows the Architecture guidance.

## Dependency Direction

High-level dependency flow:

```text
Auth
  ↓
Packages & Payments
  ↓
Events
  ↓
Players / Teams / Tasks
  ↓
Submissions
  ↓
Scoring
  ↓
Ranking
  ↓
Realtime

Media ────────────────┐
                       ├→ Reports → Retention
Achievements ─────────┤
Special Events ───────┤
AI ───────────────────┘
```

This is a conceptual dependency map, not permission to create circular imports or bypass module boundaries.

## Source of Truth

For a module implementation:

1. `PRD.md`
2. `architecture.md`
3. `DOMAIN_MODEL.md`
4. `ERD.md`
5. `API_SPEC.md`
6. `MVP_BACKLOG.md`
7. `UI_FLOWS.md`
8. relevant module file

If the documents do not define a required behavior, do not invent it silently.

## MVP Priorities

### MUST

- Auth
- Packages & Payments
- Events
- Coordinator
- Players
- Teams
- Tasks
- Submissions
- Scoring
- Ranking
- Media
- Reports
- Retention
- Realtime

### SHOULD

- Achievements
- AI

### Explicitly outside MVP

- AI Vision
- Face recognition
- Native mobile app
- Full offline-first
- Microservices
- Advanced admin panel
