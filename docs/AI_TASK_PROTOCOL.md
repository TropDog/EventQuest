# EventQuest — AI Coding Task Protocol

## Purpose

This is the operational protocol for Cursor/Claude Code when implementing EventQuest features.

## Before Coding

The agent must read:

```text
docs/README_AI.md
docs/project-overview.md
docs/architecture-decisions.md
docs/coding-rules.md
docs/DOMAIN_MODEL.md
docs/ERD.md
docs/API_SPEC.md
docs/MVP_BACKLOG.md
docs/UI_FLOWS.md
docs/IMPLEMENTATION_PLAN.md
docs/<relevant-module>.md
```

Also consult:

```text
docs/PRD.md
docs/architecture.md
```

when detailed source requirements are needed.

## Task Analysis

For every task identify:

```text
Module
Actor
User story
Acceptance criteria
Domain entities
API endpoints
UI flow
Dependencies
Realtime impact
Security impact
Tests
```

## Implementation Sequence

```text
1. Inspect current repository
2. Locate existing implementation
3. Compare code with documentation
4. Identify smallest coherent change
5. Implement backend/domain rules
6. Implement API
7. Implement frontend
8. Add realtime/media integration where applicable
9. Add tests
10. Run verification
11. Update documentation if behavior changed
```

## Do Not

- invent business rules,
- change architecture silently,
- introduce microservices,
- introduce another primary database,
- move scoring to frontend,
- bypass authorization,
- expose storage credentials,
- add coordinator/player registration,
- add AI Vision to MVP,
- implement full offline-first in MVP,
- perform unrelated refactors.

## If Requirements Conflict

Stop and report:

```text
CONFLICT
Source A:
Source B:
Impact:
Decision required:
```

Do not silently choose one interpretation.

## If Requirements Are Missing

Report:

```text
MISSING REQUIREMENT
What is missing:
Why implementation depends on it:
Safe assumptions available:
```

Do not turn an assumption into a permanent business rule without explicit approval.

## After Coding

Report:

- files changed,
- features implemented,
- tests run,
- typecheck result,
- lint result,
- build result,
- known limitations,
- documentation changes.

## Commit Discipline

Prefer focused commits:

```text
feat(auth): organizer registration
feat(events): create event
feat(tasks): sequential task state
feat(scoring): server-side score transactions
```

Avoid combining unrelated refactors with feature work.
