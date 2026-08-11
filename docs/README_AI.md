# EventQuest — AI Development Instructions

## Start Here

You are working on **EventQuest**, a SaaS / Event Engagement Platform.

Before making changes:

1. Read `docs/README_AI.md`.
2. Read `docs/project-overview.md`.
3. Read `docs/architecture-decisions.md`.
4. Read `docs/coding-rules.md`.
5. Read `docs/implementation-order.md`.
6. Read `docs/roadmap.md`.
7. Read the original `docs/PRD.md` and `docs/architecture.md` when the task requires detailed product or architecture context.
8. Read the relevant module documentation before implementing that module.
9. Inspect the existing code before modifying it.

## Source-of-Truth Hierarchy

Use this hierarchy when interpreting requirements:

```text
PRD.md
    ↓
architecture.md
    ↓
derived AI documentation
    ↓
implementation/code
```

Derived documentation must not silently contradict the PRD or Architecture.

If two source requirements conflict:

- do not invent a resolution,
- stop and report the conflict,
- ask for an explicit decision when necessary.

## Product Summary

EventQuest turns weddings, parties and events into interactive games.

Players join without accounts through QR/link/room code, perform sequential tasks, submit answers/media, earn points and follow a live ranking.

The organizer owns the event and has an account.

The coordinator operates through a dedicated token without an account.

## Core Architecture

```text
Next.js / React / TypeScript
            ↓
      NestJS / REST
            ↓
       PostgreSQL
         Prisma
```

Additional infrastructure:

- S3-compatible object storage,
- Redis,
- BullMQ,
- WebSockets,
- Stripe initially,
- OpenAI API or Azure OpenAI.

Architecture style:

**Modular Monolith + PostgreSQL + Object Storage + Real-Time Gateway**

Do not introduce microservices unless explicitly requested.

## Non-Negotiable Rules

- TypeScript across frontend and backend.
- Next.js frontend.
- NestJS backend.
- PostgreSQL.
- Prisma.
- Modular monolith.
- Backend is the source of truth for scoring, ranking and task state.
- Frontend must never calculate final points.
- Media uses signed upload URLs and direct-to-storage upload.
- Organizer is the only registered role.
- Coordinator uses magic-link/access-token access.
- Player uses a guest session.
- Player nickname cannot be changed after joining.
- Tasks are sequential.
- Ranking exposes TOP 10 and current player's position.
- No AI Vision in MVP.
- AI is limited to defined generation/summary use cases.
- Offline-first is not MVP.
- Role permissions must be checked on every endpoint.
- Package limits must come from package configuration.
- Domain enums belong in the shared package.

## Implementation Behavior

When asked to implement a feature:

### Step 1 — Understand

Identify:

- module,
- feature,
- actors,
- dependencies,
- affected data,
- API surface,
- realtime impact,
- security implications.

### Step 2 — Inspect

Read:

- relevant documentation,
- existing module,
- existing models,
- existing shared types,
- existing tests.

Do not create duplicate abstractions.

### Step 3 — Plan

Create a short implementation plan before making large changes.

If requirements are insufficient, report what is missing.

### Step 4 — Implement

Make the smallest coherent change.

Keep module boundaries intact.

Do not perform unrelated refactors.

### Step 5 — Verify

Run appropriate:

- tests,
- type checks,
- lint,
- build.

Verify authorization and error cases.

### Step 6 — Report

Summarize:

- what changed,
- files changed,
- tests run,
- known limitations,
- documentation that needs updating.

## MVP Boundaries

Do not implement outside MVP scope without explicit instruction.

Explicitly outside MVP:

- AI Vision,
- face recognition,
- native mobile application,
- full offline-first,
- microservices,
- advanced admin panel.

## When Documentation Is Missing

Do not guess business rules.

If the required behavior is not described in:

- PRD,
- Architecture,
- relevant derived documentation,
- existing implementation,

report the missing requirement.

## Module Development

Backend modules are expected to have clear boundaries and, where applicable:

- controller,
- service,
- repository,
- DTO,
- model/entity,
- guards/policies,
- tests.

The principal domains are:

1. Auth
2. Packages & Payments
3. Events
4. Coordinator
5. Players
6. Teams
7. Tasks
8. Submissions
9. Scoring
10. Ranking
11. Achievements
12. Special Events
13. Media
14. AI
15. Reports
16. Retention
17. Realtime

## Realtime Rule

The backend is authoritative.

Realtime communicates state changes; it does not become an independent business-state engine.

## Media Rule

Never expose storage administration credentials.

Use signed upload URLs.

Do not stream large media files through the backend when direct upload is possible.

## Security Rule

Never:

- store plaintext passwords,
- store coordinator tokens in plaintext,
- store guest session tokens in plaintext,
- expose JWT secrets,
- trust frontend-only authorization,
- trust frontend-calculated points.

## Final Principle

**Do not improvise architecture. Do not invent business rules. Read the relevant documentation, implement the smallest correct change, verify it, and keep the code aligned with the documented EventQuest architecture.**
