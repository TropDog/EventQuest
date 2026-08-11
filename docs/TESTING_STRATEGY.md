# EventQuest — Testing Strategy

## Purpose

Define the minimum testing approach for AI-assisted implementation.

## Principles

- Business rules are tested at the backend.
- Authorization is tested explicitly.
- Event isolation is tested explicitly.
- Frontend tests must not replace backend business-rule tests.
- Every module should have tests where applicable.

## Unit Tests

Focus on pure business rules:

- event state transitions,
- package usage,
- participant limits,
- team capacity,
- nickname immutability,
- task sequencing,
- submission limits,
- anti-spam decisions,
- quiz scoring,
- team scoring,
- ranking calculation,
- special-event state,
- achievement qualification,
- retention decisions.

## Integration Tests

Cover:

- PostgreSQL/Prisma persistence,
- organizer authentication,
- coordinator access,
- player guest sessions,
- package purchase state,
- event ownership,
- task/submission flow,
- media metadata confirmation,
- report job persistence,
- cleanup jobs.

## API Tests

For every protected endpoint verify:

```text
actor type
event access
role permissions
event status
package limits where relevant
```

Negative authorization tests are required.

## Realtime Tests

Verify:

- correct event channel,
- player/coordinator/organizer separation,
- ranking updates,
- task unlocks,
- special-event events,
- media events,
- achievement events,
- event closure.

## Media Tests

Verify:

- signed URL authorization,
- file type,
- file size,
- video duration,
- metadata persistence,
- event isolation,
- failed upload/retry behavior.

## Critical E2E Flow

```text
Organizer registers
↓
Package available/purchased
↓
Event created
↓
Tasks configured
↓
Player joins
↓
Terms accepted
↓
Nickname selected
↓
Task completed
↓
Submission accepted
↓
Score awarded
↓
Ranking updated
```

## Coordinator E2E Flow

```text
Coordinator link
↓
Token validated
↓
Event opened
↓
Special event started
↓
Realtime update
↓
Player/Big Screen receives event
↓
Scoring effect applies
```

## Report E2E Flow

```text
Event closed
↓
Report requested
↓
Job queued
↓
Report generated
↓
Organizer downloads
↓
Media cleanup
```

## Definition of Done

A feature is not complete until:

- relevant tests pass,
- type checking passes,
- linting passes,
- build passes where applicable,
- authorization is verified,
- no critical known issue remains.
