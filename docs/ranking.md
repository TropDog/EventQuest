# EventQuest — Ranking Module

## Responsibility

Provides authoritative player/team ranking based on server-side scoring.

## Scope

### MUST
- TOP 10
- Player's own position
- Player's own score
- Team ranking

## API

```text
GET /events/:eventId/ranking/top
GET /events/:eventId/ranking/me
GET /events/:eventId/ranking/teams
```

## Domain

Primary entity:

- `RankingSnapshot`

The Architecture recommends ranking snapshot caching for scalability but does not fully specify its physical schema.

## Rules

- Ranking is event-scoped.
- Ranking consumes authoritative score state.
- Frontend never calculates final ranking.
- Player can see TOP 10 and own position.
- Team ranking is available in team mode.

## Realtime

Ranking changes publish:

```text
RANKING_UPDATED
```

through event-specific WebSocket channels.

## Scalability

Architecture recommends:

- ranking snapshot caching,
- database indexes on event-related data,
- WebSocket rooms per event.

## Dependencies

- Scoring
- Players
- Teams
- Realtime

## Tests

Cover score ordering, own-position lookup, TOP 10, team ranking, event isolation and update propagation.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
