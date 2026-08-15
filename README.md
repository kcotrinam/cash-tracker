# CashTracker

CashTracker is a calm, mobile-first personal-finance web app for independent professionals. This repository currently provides its monorepo foundation only; Prisma, authentication, and financial features are intentionally deferred.

## Prerequisites

- Node.js 24 or newer
- pnpm 11 or newer
- Docker Desktop (for PostgreSQL)

## Setup

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Environment examples contain placeholders only. Set a safe local `POSTGRES_PASSWORD` before starting the database, and keep the corresponding value in `DATABASE_URL` aligned.

## Local development

```bash
pnpm db:up
pnpm dev
```

The web app runs on `http://localhost:3000`; the API defaults to `http://localhost:3001`. API documentation is available at `/api/docs` outside production.

## Quality commands

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm format:check
```

Database helpers: `pnpm db:up`, `pnpm db:down`, and `pnpm db:logs`.

## Structure

```text
apps/web             Next.js frontend
apps/api             NestJS REST API
packages/types       Shared domain primitives
packages/config      Shared tooling configuration
packages/api-client  Placeholder for generated OpenAPI client code
infra/docker         Local PostgreSQL Compose configuration
```

See [PRODUCT.md](PRODUCT.md) for confirmed product scope and [AGENTS.md](AGENTS.md) for development conventions.
