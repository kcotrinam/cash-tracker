# CashTracker architecture

This document describes architecture verified from the repository. Planned work is
listed separately and is not presented as implemented.

## Current architecture

### Monorepo

CashTracker uses pnpm workspaces and Turborepo. Applications live in `apps/`, reusable
workspace packages in `packages/`, and local infrastructure in `infra/`.

Root scripts coordinate development, linting, type-checking, tests, builds, formatting,
and the local PostgreSQL container. Shared TypeScript and Prettier configuration is
published internally from `packages/config`.

### Web application

`apps/web` is a Next.js App Router application written in strict TypeScript. It uses
Tailwind CSS v4, CSS custom properties in `apps/web/app/globals.css`, and `next-intl`
message catalogs for English and Spanish.

The browser communicates directly with the REST API using the URL in
`NEXT_PUBLIC_API_URL`. Authenticated requests include credentials so the API's HTTP-only
cookies are sent. Screen and feature code currently lives under `apps/web/app`.

### API

`apps/api` is a NestJS REST API. Feature modules cover authentication, users,
categories, transactions, recurring transactions, settings, dashboard data, and health.
Controllers validate and delegate to services. A global validation pipe strips unknown
input and rejects non-whitelisted properties.

Helmet is enabled and CORS accepts configured web origins with credentials. Swagger is
generated at `/api/docs` outside production.

### Authentication and authorization

The API issues short-lived JWT access tokens and rotating refresh tokens. The web flow
uses HTTP-only access and refresh cookies. Bearer access tokens are also accepted, and
registration and login return tokens for non-browser clients.

Refresh tokens are stored only as hashes in PostgreSQL and can be revoked. Protected
controllers derive the current user from the verified access token, and services scope
user-owned queries and mutations by that user identifier.

### Persistence

The API uses Prisma with PostgreSQL through the Prisma PostgreSQL adapter. The schema and
committed migrations live in `apps/api/prisma`; Prisma access is provided through a
global NestJS module.

Money is stored as `DECIMAL(19,4)` and serialized as strings in API responses. Financial
dates are stored as PostgreSQL `DATE` values and serialized as `YYYY-MM-DD`. Some domain
invariants that Prisma does not represent are enforced by explicit PostgreSQL check
constraints. See [domain.md](domain.md) and
[001-enforce-domain-invariants-in-postgresql.md](decisions/001-enforce-domain-invariants-in-postgresql.md).

The persistence model includes user-owned credit cards and credit-card payments. Existing
transactions may optionally reference a credit card; deleting a card sets that reference
to null, preserving transaction history. Credit-card and payment amounts use the same
`DECIMAL(19,4)` representation, and payment dates use PostgreSQL `DATE` values.
Credit-card statements are materialized lazily on card reads after a closing date; payment
applications preserve oldest-statement-first allocation without requiring a scheduler.

### Local infrastructure

`infra/docker/docker-compose.yml` defines the local PostgreSQL service and its persistent
Docker volume. Environment values come from the root `.env` file when the root database
scripts invoke Docker Compose.

### Shared packages

- `packages/config` is actively consumed for shared TypeScript and Prettier settings.
- `packages/types` currently exposes initial currency and transaction-direction
  primitives, but application code still has local equivalents; it is not yet the sole
  source of truth.
- `packages/api-client` is an empty placeholder and is not consumed by the applications.

## Planned or not currently implemented

- OpenAPI client generation and committed generated client types are planned but no
  generator exists yet.
- A recurrence-processing service method exists, but no background worker or automatic
  scheduler invokes it.
- No deployment architecture or CI pipeline is defined in this repository.
- There is no shared UI package; reusable UI remains within the web application until a
  real cross-application reuse case exists.
