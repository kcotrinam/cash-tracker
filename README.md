# CashTracker

CashTracker is a responsive personal-finance application for independent professionals.
This monorepo contains the Next.js web application, NestJS API, Prisma/PostgreSQL
persistence, shared packages, and local infrastructure.

## Prerequisites

- Node.js 24 or newer
- pnpm 11 or newer
- Docker Desktop or another Docker Compose-compatible runtime

## Setup

Install dependencies and create local environment files:

```bash
pnpm install
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

The example files contain local placeholders only. Set a safe local PostgreSQL password
and keep the database credentials in the root and API environment files aligned.

## Local development

Start PostgreSQL, then run the web application and API through Turborepo:

```bash
pnpm db:up
pnpm dev
```

The web application defaults to `http://localhost:3000` and the API to
`http://localhost:3001`. In non-production environments, Swagger documentation is at
`http://localhost:3001/api/docs`.

Run one application independently when needed:

```bash
pnpm --filter @cashtracker/web dev
pnpm --filter @cashtracker/api dev
```

## Database workflow

Prisma lives in `apps/api/prisma`.

```bash
pnpm --filter @cashtracker/api db:generate
pnpm --filter @cashtracker/api db:migrate
```

Local PostgreSQL helpers are `pnpm db:up`, `pnpm db:down`, and `pnpm db:logs`.

## Quality commands

Run these commands from the repository root:

```bash
pnpm format:check
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## Repository structure

```text
apps/web             Next.js App Router frontend
apps/api             NestJS REST API and Prisma persistence
packages/config      Shared TypeScript and Prettier configuration
packages/types       Initial shared domain primitives
packages/api-client  Placeholder for a future generated OpenAPI client
infra/docker         Local PostgreSQL Compose configuration
docs                 Architecture, domain, design, and decision documentation
```

## Documentation

- [Product scope](PRODUCT.md)
- [Domain rules](docs/domain.md)
- [System architecture](docs/architecture.md)
- [Design documentation](docs/design/README.md)
- [Coding-agent guidance](AGENTS.md)
