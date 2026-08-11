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

For organizer auth specifically, the refresh-token persistence decision is resolved:
- refresh tokens are server-tracked in `OrganizerRefreshToken`,
- only token hashes are persisted,
- expiry and revocation are server-side,
- logout revokes the corresponding refresh-token session.

Still open:
- exact refresh-token transport,
- exact refresh/logout DTOs,
- refresh-token rotation policy,
- exact access/refresh token TTL values as product rules (MVP defaults are environment-configured; see `auth.md` — **Organizer Auth — MVP Implementation Notes**).

Player guest-session join defaults are partially resolved for the SOLO MVP scope; see `players.md` — **Player Guest Session — MVP Implementation Notes**.

Still open for players:
- exact joinable event statuses as a formal product rule beyond the current `ACTIVE`-only MVP default,
- guest-session expiry/revocation policy if added beyond the current `Player` model,
- duplicate-nickname policy if explicitly forbidden later,
- formal room-code uniqueness enforcement strategy.

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

## Resolved Decision — Organizer Refresh Tokens

The organizer refresh-token persistence gap identified during Auth implementation is resolved.

### Decision

Use a dedicated `OrganizerRefreshToken` entity/table related to `OrganizerAccount`.

Fields:

```text
id
organizer_id
token_hash
expires_at
revoked_at
created_at
```

Rules:

- only token hashes are persisted,
- token hashes are unique,
- refresh tokens expire,
- refresh tokens can be revoked,
- revoked/expired refresh tokens are rejected,
- logout revokes the corresponding refresh-token session.

Also enforce:

```text
OrganizerAccount.email = UNIQUE
```

This decision is now reflected in:

- `DOMAIN_MODEL.md`
- `ERD.md`
- `auth.md`
- `API_SPEC.md`
- `IMPLEMENTATION_PLAN.md`
- `MVP_BACKLOG.md`
- `architecture-decisions.md`
- `architecture.md`
- `project-overview.md`

Do not treat organizer refresh-token persistence or organizer email uniqueness as open requirements anymore.
