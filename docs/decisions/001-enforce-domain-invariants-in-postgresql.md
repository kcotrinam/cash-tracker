# Enforce domain invariants in PostgreSQL

## Status

Accepted

## Context

Financial amounts, recurrence intervals, anchor days, and recurrence date ranges must
remain valid for every writer. Prisma does not represent all required PostgreSQL check
constraints in its schema.

## Decision

Enforce invariants that must hold independently of the API with explicit PostgreSQL
check constraints committed in Prisma migrations. The current constraints require
positive transaction and recurring amounts, positive recurrence intervals, valid
monthly anchor days, and end dates that do not precede start dates.

## Consequences

- Invalid data is rejected even when written outside the NestJS API.
- Application validation should provide useful errors before the database is reached,
  but it is not the final enforcement boundary.
- Schema reviews must inspect both `schema.prisma` and committed migrations because the
  Prisma model alone does not show every invariant.
