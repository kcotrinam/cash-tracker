# CashTracker product brief

## Platform and stack

CashTracker is a responsive, mobile-first personal finance web application. Its foundation uses a pnpm/Turborepo monorepo, a Next.js App Router frontend, a NestJS REST API, PostgreSQL in Docker Compose, Tailwind CSS v4, and CSS variables for design tokens and theming.

## Users and purpose

It is for independent professionals with fixed income, freelance income, recurring expenses, and variable expenses. The product helps them understand their monthly income, expenses, and remaining balance quickly.

## Operating context

The product is Spanish-first and prepared for future internationalization. It supports light and dark themes. The initial currencies are PEN and USD; totals must never combine them without an explicit exchange-rate feature.

## Intended capabilities

Later phases will add authentication, PostgreSQL/Prisma data access, financial transactions, recurring income and expenses, and a dashboard. The REST API will expose an OpenAPI description.

## Constraints and future scope

The current foundation does not include Prisma, authentication, financial domain logic, or the dashboard. S3 uploads, bank accounts, wallets, transfers, exchange rates, and automated recurring generation are future scope.

## Product principles

The experience should be minimal, calm, human, and easy to use. It should not resemble a corporate banking or accounting product.

## Accessibility

The application targets WCAG AA, semantic and keyboard-accessible interaction, visible focus states, and generously sized touch targets on mobile.
