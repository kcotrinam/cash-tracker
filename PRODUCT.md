# CashTracker product brief

## Platform and stack

CashTracker is a responsive, mobile-first personal finance web application. Its foundation uses a pnpm/Turborepo monorepo, a Next.js App Router frontend, a NestJS REST API, PostgreSQL in Docker Compose, Tailwind CSS v4, and CSS variables for design tokens and theming.

## Users and purpose

It is for independent professionals with fixed income, freelance income, recurring expenses, and variable expenses. The product helps them understand their monthly income, expenses, and remaining balance quickly.

## Operating context

The product is Spanish-first and prepared for future internationalization. It supports light and dark themes. The initial currencies are PEN and USD; totals must never combine them without an explicit exchange-rate feature.

## Intended capabilities

The application includes authentication, PostgreSQL/Prisma-backed categories and transactions, and recurring income and expense rules. A recurring rule is a schedule; it affects financial totals only after it creates a linked actual transaction. The REST API exposes OpenAPI documentation outside production.

## Constraints and future scope

S3 uploads, bank accounts, wallets, transfers, exchange rates, and a background scheduler are future scope. The recurrence processor is deliberately callable from a future worker; no automatic scheduler is introduced until the project has an established job runtime.

## Product principles

The experience should be minimal, calm, human, and easy to use. It should not resemble a corporate banking or accounting product.

## Accessibility

The application targets WCAG AA, semantic and keyboard-accessible interaction, visible focus states, and generously sized touch targets on mobile.
