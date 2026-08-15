**CashTracker — Agent & Developer Guide**

Purpose: concise, actionable guidance for developers and coding agents working in this repository.

**Project Overview**
- **Product**: CashTracker — a responsive, mobile-first personal finance web app.
- **Primary users**: independent professionals (fixed and freelance income) who need a calm, minimal view of monthly income, expenses, and remaining balance.
- **Design goals**: minimal, calm, human; Spanish-first UI; accessible (WCAG AA); light/dark themes; large mobile touch targets.

**Repository Structure (high-level)**
- `apps/web` — Next.js (App Router) + TypeScript frontend.
- `apps/api` — NestJS REST API with Swagger/OpenAPI.
- `packages/*` — shared utilities, UI primitives, types, and OpenAPI client generator.
- `prisma` — Prisma schema and migrations.
- `docker-compose.yml` — local development environment.
- `AGENTS.md` — this file.

**Technology Stack**
- Monorepo: pnpm workspaces + Turborepo.
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui primitives (customized), CSS variables for tokens; prefer Tailwind utility classes; use CSS Modules only when necessary.
- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Swagger/OpenAPI for API spec.
- Local infra: Docker Compose for Postgres, optional local API.
- CI: lint, typecheck, tests, build (configured in repo CI pipelines).

**How Agents Should Operate**
- Always read this file and the repository README before making changes.
- Create small, focused changes. Leave controllers thin — business logic belongs in NestJS services.
- Ensure every user-owned query is scoped by `user_id` (authenticated user). Do not return user data without proper scoping.
- Use strict TypeScript and keep lint/type errors clean. Run `pnpm` scripts locally before opening PRs.
- For any DB schema changes, create a Prisma migration and commit it. Do not edit production schema manually.

**Domain Rules (canonical)**
- Core models: Users, Categories (type: `INCOME` | `EXPENSE`), Transactions, RecurringTransactions, UserSettings.
- Transaction types: `INCOME` and `EXPENSE` only. Each transaction belongs to a single user and a single category.
- Recurring items only affect dashboard totals after an occurrence is recorded as a real Transaction.
- Monetary values: store as PostgreSQL decimal (Prisma `Decimal`), return as strings in API JSON.
- Date format: `YYYY-MM-DD` for all financial dates.
- Currencies v1: PEN and USD. Never mix PEN and USD totals without an explicit exchange-rate operation.
- Exclude: bank accounts, wallets, transfers, automatic recurring generation, S3 attachments are out-of-scope for MVP.

**API & Database Conventions**
- API: REST endpoints in `apps/api` with OpenAPI/Swagger documentation. Keep controllers thin — validate and delegate to services.
- Types: Generate API client types from OpenAPI; place generator in `packages/` and commit generated types to avoid friction in PRs.
- Auth: JWT or session-based token; provide endpoints for register, login, refresh, logout, and `GET /me` (current user).
- Validation: Validate all inputs at the controller boundary using DTOs and class-validator (or equivalent).
- Authorization: enforce per-user scoping on every data query/update.
- Money: use Prisma `Decimal` with scale suited for currency (store exact decimals). Convert to string in responses to avoid float issues.
- Migrations: use Prisma migrations for every DB change. Run locally and in CI. Include a migration in any PR that touches the schema.

**Frontend & Design Conventions**
- Language & i18n: Spanish-first UI. Architect with i18n in mind (next-intl or equivalent) so strings are externalized.
- Styling: Tailwind CSS v4 + CSS variables for tokens (colors, spacing, radii). Use shadcn/ui primitives for accessible building blocks and adapt them to CashTracker tokens.
- Theming: CSS variables control light/dark themes. Persist user theme preference in `UserSettings`.
- Accessibility: target WCAG AA. Use semantic HTML, visible focus states, keyboard navigation, ARIA where needed, and large touch targets on mobile.
- UI tone: calm, minimal, human — avoid banking-like dashboards, heavy gradients, or dense widgets. Prioritize a single quick “add income/expense” action on mobile.
- Components: keep presentational components in `packages/ui` so they are reusable across apps. Keep business logic in hooks/services.

**Testing & Quality Checks**
- Tests: add unit tests for business rules (service layer), authorization boundaries, financial totals, and recurring transaction behavior.
- Coverage: CI must run `pnpm lint`, `pnpm type-check`, tests, and builds before merge.
- PRs: small, focused, with clear changelogs. Include migration files if DB changed and update `prisma` state.

**Security & Environment Variables**
- Do not commit secrets. Keep `.env` in `.gitignore` and maintain `.env.example` with placeholder values.
- Use environment variables for DB URLs, JWT secrets, third-party keys, and feature flags.
- For local dev, use Docker Compose credentials only in `.env` or developer-managed secrets.

**Developer Workflow & Useful Commands**
Run these from the repository root (examples — adapt to repo scripts):

```bash
pnpm install
pnpm turbo run build --filter=apps/...
pnpm --filter apps/api dev    # run API locally
pnpm --filter apps/web dev    # run frontend locally
docker compose up -d          # start local Postgres + infra
pnpm prisma migrate dev       # apply migrations locally
pnpm test                     # run tests
```

**Future Scope Boundaries**
- Out of scope for MVP: bank integrations, account/wallet abstractions, automatic recurring generation, S3 attachments, multi-currency totals without explicit conversion.
- Future phases may add: S3 attachments, exchange-rate support, scheduled background jobs for recurring generation, and expanded account models.

**Notes for Agents**
- When modifying behavior that affects financial totals, add tests that assert numeric string results and edge cases (nulls, zero, negative values).
- Always run migrations locally and include them in PRs. If unsure, ask a human reviewer to confirm migration strategy for production.
- Keep PRs small and focused. Communicate intent in PR descriptions and link migrations, API changes, and frontend updates together.

If anything in this document is unclear or you need repository-specific scripts, open an issue or ask a human maintainer before making large changes.
