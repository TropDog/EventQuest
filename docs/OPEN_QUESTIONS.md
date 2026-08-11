# EventQuest — Open Questions / Underspecified Areas

## Purpose

This file prevents AI agents from treating unspecified details as established product requirements.

The PRD and Architecture define the product and technical direction well, but some implementation-level details remain open.

## 1. Exact API DTOs

The Architecture defines endpoint paths and responsibilities but does not fully specify every:

- request JSON,
- response JSON,
- HTTP status,
- error code,
- pagination contract.

These should be finalized per feature.

## 2. Exact RankingSnapshot Schema

`RankingSnapshot` is defined as a domain entity and caching mechanism, but the exact physical schema is not fully specified.

Resolve before implementing production-grade ranking caching.

## 3. Exact AI Generated Task Set Schema

`AiGeneratedTaskSet` is a domain concept, but the Architecture does not provide a complete physical field list.

Resolve when AI task generation is implemented.

## 4. Exact Achievement Rules

Achievement names/examples are defined, but exact thresholds and qualification rules are not fully specified for every achievement.

Do not invent exact thresholds.

## 5. Special Event Scoring Formulas

Special-event types are defined:

```text
Happy Hour
Flash Quest
Golden Quest
Team Challenge
```

The exact scoring formulas and detailed mechanics are not fully defined.

Do not invent them silently.

## 6. Report Format

The Architecture requires a basic final report and describes its contents, but does not fully specify:

- file format,
- visual layout,
- exact sections,
- exact export behavior.

## 7. Scheduler Cadence

Retention jobs are named, but their exact recurring cadence is not defined.

Do not treat an arbitrary schedule as a product requirement.

## 8. Payment UX

Stripe is the initial provider, but exact checkout UX and every payment state are not fully specified.

## 9. Offline Future Architecture

Offline-first is explicitly outside MVP.

Future requirements are described conceptually, including:

- local task cache,
- submission queue,
- temporary IDs,
- sync endpoint,
- conflict resolution,
- upload retry.

Do not implement these in MVP.

## 10. Final Provider Choices

Architecture lists alternatives for:

- object storage,
- hosting,
- WebSocket implementation,
- AI provider.

The project should make explicit implementation choices before production deployment.

## Rule

When an open question becomes necessary for implementation:

1. identify it,
2. record the decision,
3. update the relevant documentation,
4. only then encode the rule in code.
