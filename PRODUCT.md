# CashTracker product brief

## Purpose

CashTracker helps independent professionals understand their income, expenses, recurring
commitments, and remaining monthly balance without the density of a traditional
accounting or banking product.

## Target users

The primary users combine fixed or freelance income with recurring and variable
expenses. They need a quick, calm view of the month and a low-friction way to record
financial activity.

## Product goals

- Make the current month's financial position easy to understand.
- Make recording an income or expense fast on mobile and desktop.
- Keep the experience minimal, calm, personal, and human.
- Provide a Spanish-first interface prepared for internationalization.
- Support accessible interaction, WCAG AA contrast, and generous mobile touch targets.
- Support light and dark appearance preferences.

## MVP capabilities

- Account registration, sign-in, session restoration, sign-out, and password changes.
- User-owned income and expense categories.
- Income and expense recording, editing, filtering, and deletion.
- Monthly dashboard summaries separated by currency.
- Recurring income and expense schedules, including an option to record an occurrence.
- Profile, currency, language, timezone, category, and security settings.

## MVP non-goals

- Bank integrations
- Accounts or wallet abstractions
- Transfers between accounts
- Automatic exchange-rate conversion or mixed-currency totals
- Automatic background scheduling of recurring occurrences
- Receipt or attachment storage
- S3 integration

## Future scope

Future work may add exchange-rate support, attachment storage, bank or account models,
and a background job runtime. These are not current product capabilities.

Technology-independent financial rules are documented in
[docs/domain.md](docs/domain.md). Implementation details are documented in
[docs/architecture.md](docs/architecture.md).
