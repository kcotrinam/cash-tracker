# CashTracker agent guide

Use this file for repository-wide operating rules. Read [README.md](README.md) before
changing the project and follow any more specific `AGENTS.md` found below the files you
touch.

## Before changing code

- Inspect existing patterns before adding an abstraction, package, or dependency.
- Keep changes small and focused. Do not mix unrelated cleanup with feature work.
- Use pnpm and the existing workspace scripts.
- Keep TypeScript strict and leave lint, type-check, test, and build commands clean.
- Do not introduce a shared package until at least two real consumers need it.

## API and persistence

- The API uses NestJS. Keep controllers thin; validation belongs at the boundary and
  business logic belongs in services.
- Validate request input with DTOs and `class-validator`.
- Scope every read, update, and delete of user-owned data to the authenticated user.
- Prisma is implemented under `apps/api/prisma`. Make every database schema change
  through a committed Prisma migration; never edit a production schema manually.
- Preserve exact decimal handling and string serialization for money. Follow the
  invariants in [docs/domain.md](docs/domain.md).
- Do not manually duplicate API DTOs in `packages/api-client`. Its OpenAPI generation
  workflow is planned but not implemented.

## Web application

- The web app uses the Next.js App Router, Tailwind CSS v4, CSS variables, and
  `next-intl`. Follow `apps/web/AGENTS.md` for version-specific Next.js guidance.
- Keep user-facing strings externalized and maintain the Spanish-first product direction.
- Preserve semantic HTML, keyboard navigation, visible focus, WCAG AA contrast, and
  touch-friendly controls.
- Reuse an existing component before creating a new abstraction. Move UI into a shared
  package only when there is demonstrated cross-application reuse.
- Update `docs/design/screen-map.md` whenever a screen is added, removed, renamed, or
  its application route changes.

## Security and quality

- Never commit secrets. Keep local values in ignored `.env` files and placeholders in
  versioned `.env.example` files.
- Add or update service-level tests for business rules, authorization boundaries,
  financial totals, and recurring-transaction behavior affected by a change.
- Run the relevant commands documented in [README.md](README.md) before handing work
  back. Include Prisma migrations whenever the schema changes.

## Documentation ownership

- [PRODUCT.md](PRODUCT.md): what CashTracker is building and its scope.
- [docs/domain.md](docs/domain.md): technology-independent business rules.
- [docs/architecture.md](docs/architecture.md): current and explicitly planned system
  architecture.
- `docs/decisions/`: rationale for accepted technical decisions.
- [README.md](README.md): developer setup and repository workflow.

Update the canonical document when behavior or architecture changes; do not copy the
same source of truth into multiple files.
