# EventQuest — Documentation Index

## Source Documents

These are the primary sources:

- `PRD.md`
- `architecture.md`

They define the product requirements and technical architecture.

## Global AI Documentation

- `README_AI.md`
- `project-overview.md`
- `coding-rules.md`
- `architecture-decisions.md`
- `implementation-order.md`
- `roadmap.md`

## Domain & Contracts

- `DOMAIN_MODEL.md`
- `ERD.md`
- `API_SPEC.md`

## Product Planning

- `MVP_BACKLOG.md`
- `UI_FLOWS.md`
- `IMPLEMENTATION_PLAN.md`

## Module Documentation

- `MODULES_INDEX.md`
- `auth.md`
- `packages-payments.md`
- `events.md`
- `coordinator.md`
- `players.md`
- `teams.md`
- `tasks.md`
- `submissions.md`
- `scoring.md`
- `ranking.md`
- `achievements.md`
- `special-events.md`
- `media.md`
- `ai.md`
- `reports.md`
- `retention.md`
- `realtime.md`

## Engineering Support

- `MODULE_DEPENDENCIES.md`
- `TESTING_STRATEGY.md`
- `DEPLOYMENT.md`
- `AI_TASK_PROTOCOL.md`
- `OPEN_QUESTIONS.md`

## Reading Order for AI

```text
1. README_AI.md
2. project-overview.md
3. architecture-decisions.md
4. coding-rules.md
5. DOMAIN_MODEL.md
6. ERD.md
7. API_SPEC.md
8. MVP_BACKLOG.md
9. UI_FLOWS.md
10. IMPLEMENTATION_PLAN.md
11. relevant module file
12. TESTING_STRATEGY.md
13. OPEN_QUESTIONS.md
```

For deployment work also read:

```text
DEPLOYMENT.md
```

For cross-module work also read:

```text
MODULE_DEPENDENCIES.md
```

## Source-of-Truth Rule

```text
PRD
  ↓
Architecture
  ↓
Derived documentation
  ↓
Code
```

Derived documentation must not silently override the PRD or Architecture.

## Completion Rule

When code changes a documented product or architecture rule, update the relevant documentation.

When a previously open question is decided, remove ambiguity by documenting the decision.
