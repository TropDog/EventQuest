# EventQuest — Auth Module

## Responsibility

The Auth module handles the three documented access models:

- Organizer: email + password + JWT access token + refresh-token session
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
- `OrganizerRefreshToken`
- `CoordinatorAccess`
- `Player`

Relevant fields include organizer credentials/terms, organizer refresh-token hash/expiry/revocation, coordinator token hash/expiry/revocation and player guest-token hash/session fields.

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

Authenticated with a JWT access token plus a server-tracked refresh-token session.

Can access only organizer-owned event data.

Refresh-token rules:

- raw refresh tokens are never persisted;
- only a hash is stored in `OrganizerRefreshToken`;
- expired refresh tokens are rejected;
- revoked refresh tokens are rejected;
- logout revokes the refresh-token session used for that logout operation.

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
- Organizer refresh tokens must be stored only as hashes.
- Organizer refresh tokens must support server-side expiry and revocation.
- Coordinator tokens must be stored as hashes.
- Guest session tokens must be stored as hashes.
- JWT secret must be in environment variables.
- Refresh-token secrets must not be exposed through frontend-readable response payloads.
- Response payloads must never include `password_hash`, `token_hash`, or JWT signing secrets.
- The opaque refresh token value may be returned to the client for subsequent refresh/logout requests; only its hash is persisted server-side.
- Never trust frontend-only authorization.

## Organizer Auth — MVP Implementation Notes

The following choices are documented implementation defaults for the current organizer-auth phase. They are not additional product rules unless explicitly promoted elsewhere.

### Refresh-token rotation

- Refresh-token rotation policy is **not defined** in the source documents.
- MVP implementation: `/auth/refresh` issues a **new access token** and **does not rotate** the refresh token.
- The same refresh-token session remains valid until expiry, revocation, or logout.

### Token expiry (environment configuration)

Access and refresh lifetimes are configured through environment variables, not hardcoded product limits:

| Setting | Default | Purpose |
|---|---|---|
| `JWT_ACCESS_EXPIRES_IN` | `15m` | JWT access-token lifetime |
| `JWT_REFRESH_EXPIRES_IN_DAYS` | `7` | Refresh-token session lifetime |

### Password hashing

- Implementation uses **bcrypt** (architecture also allows argon2).
- Default bcrypt cost factor: **12** (implementation detail).

### Email normalization

- Organizer email is stored and looked up in **lowercase** form.
- This supports consistent duplicate-email rejection with the documented `UNIQUE` constraint.

### Interim auth API contract

Until full DTO specifications are added, the MVP organizer-auth endpoints use:

**Register / login / refresh success response:**

```json
{
  "organizer": {
    "id": "string",
    "email": "string",
    "termsAcceptedAt": "ISO-8601 datetime",
    "createdAt": "ISO-8601 datetime"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Refresh request body:**

```json
{
  "refreshToken": "string"
}
```

**Logout request body:**

```json
{
  "refreshToken": "string"
}
```

**Logout success response:**

```json
{
  "success": true
}
```

**`/auth/me` success response:** the `organizer` object shape above (without tokens).

### Post-registration authentication

- Successful registration returns the **same auth session shape as login** (organizer profile + access token + refresh-token session).
- This supports the documented organizer UI flow where registration success leads directly to an authenticated session.

## Module Boundaries

Auth provides identity/access context to other modules. It does not own event gameplay, scoring or ranking logic.

## Tests

Cover:

- registration,
- duplicate organizer,
- login,
- invalid credentials,
- refresh with valid token,
- rejection of expired refresh token,
- rejection of revoked refresh token,
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
