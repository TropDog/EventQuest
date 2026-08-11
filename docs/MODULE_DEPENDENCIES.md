# EventQuest — Module Dependencies

## Purpose

This document defines the recommended high-level dependency order for the 17 backend modules.

It is a development boundary, not permission to create direct imports between every module.

## Dependency Map

```text
Auth
  ↓
Packages & Payments
  ↓
Events
  ├── Coordinator
  ├── Players
  │     └── Teams
  └── Tasks
          ↓
      Submissions
          ↓
       Scoring
          ↓
       Ranking
          ↓
      Realtime

Tasks ───────────────┐
Players ─────────────┤
Submissions ─────────┤
Ranking ──────────────┤
Achievements ────────┤
Special Events ──────┤
Media ───────────────┼→ Reports → Retention
AI ──────────────────┘
```

## Core Rules

### Auth

Provides access context. It should not own gameplay logic.

### Packages & Payments

Provides package availability and participant limits to Events.

### Events

Defines the event boundary used by most gameplay modules.

### Players / Teams

Define who participates and how team membership works.

### Tasks

Defines what players can do.

### Submissions

Records player attempts and media-submission context.

### Scoring

Consumes valid submissions and produces score transactions.

### Ranking

Consumes authoritative score state.

### Realtime

Publishes changes from authoritative modules.

### Reports

Aggregates event data from multiple modules.

### Retention

Acts on media/report/event lifecycle data.

## Boundary Rule

Do not solve a dependency problem by importing another module's repository directly.

Prefer application/service-level contracts or clearly defined module interfaces.

The exact internal dependency-injection structure is an implementation decision, but the domain boundaries must remain clear.
