# EventQuest — Auth Module

## Responsibility

The Auth module handles the three documented access models:

- Organizer: email + password + JWT
- Coordinator: magic link / access token
- Player: guest session token

It is responsible for organizer registration/login, password hashing, JWT sessions, coordinator token handling and player session handling.

## Scope

### MUST
- Organizer registration
- Organizer login
- JWT session
- Password hashing
- Coordinator token validation
- Player guest-session handling

## Domain

Primary entities:

- `OrganizerAccount`
- `CoordinatorAccess`
- `Player`

Relevant fields include organizer credentials/terms, coordinator token hash/expiry/revocation and player guest-token hash/session fields.

## API

```text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
GET  /coordinator/:token
```

Player session creation is part of the player join flow.

## Access Rules

### Organizer

Authenticated with JWT.

Can access only organizer-owned event data.

### Coordinator

No registered account.

Uses a dedicated token associated with one event.

Token must be stored as a hash.

### Player

No registered account.

Uses an event-scoped guest session token.

Token must be stored as a hash.

## Security

- Passwords must use bcrypt or argon2.
- Never store plaintext passwords.
- Coordinator tokens must be stored as hashes.
- Guest session tokens must be stored as hashes.
- JWT secret must be in environment variables.
- Never trust frontend-only authorization.

## Module Boundaries

Auth provides identity/access context to other modules. It does not own event gameplay, scoring or ranking logic.

## Tests

Cover:

- registration,
- duplicate organizer,
- login,
- invalid credentials,
- refresh,
- logout/revocation behavior,
- coordinator token validation,
- coordinator expiry/revocation,
- player session isolation,
- unauthorized access.

## AI Implementation Rules

- Keep the module inside the modular-monolith boundary.
- Use TypeScript.
- Follow the existing NestJS/Next.js/PostgreSQL/Prisma architecture.
- Keep controller, service, repository, DTO, model/entity, guards/policies and tests separated where applicable.
- Backend is authoritative for business state.
- Validate actor type, event access, role permissions, event status and package limits where relevant.
- Do not introduce a new business rule when the source documents do not define one.
- Read `PRD.md`, `architecture.md`, `DOMAIN_MODEL.md`, `ERD.md`, `API_SPEC.md`, `MVP_BACKLOG.md`, `UI_FLOWS.md` and this module document before implementing a significant feature.
