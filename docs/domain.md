# CashTracker domain rules

This document records business invariants that must remain true regardless of the
framework or persistence technology used to implement CashTracker.

## Ownership and relationships

- A user owns their settings, categories, transactions, and recurring transactions.
- Every category belongs to exactly one user.
- Every transaction belongs to exactly one user and one category.
- Every recurring transaction belongs to exactly one user and one category.
- A user may only read or modify their own financial data.

## Transaction direction and categories

- Financial direction is either `INCOME` or `EXPENSE`.
- A category has one of those same directions.
- A transaction or recurring transaction must use an active category owned by the same
  user and matching its direction.
- Category names are unique per user and direction after trimming whitespace, collapsing
  repeated spaces, removing accents for comparison, and normalizing case.
- CashTracker provisions localized default categories for a new user.
- The fallback categories for other income and other expenses cannot be deactivated.

## Money and currencies

- Amounts are exact decimal values, never floating-point approximations.
- Transaction and recurring amounts must be greater than zero and may have at most four
  decimal places.
- The supported currencies are `PEN` and `USD`.
- Totals must never combine currencies without an explicit exchange-rate operation.
- Dashboard income, expense, balance, and category distribution are calculated for one
  selected month and one selected currency.
- Monthly net balance is recorded income minus recorded expenses for that month and
  currency.

## Financial dates

- Financial dates use the calendar-date format `YYYY-MM-DD`.
- Month filters use `YYYY-MM`.
- A financial date represents a date without a time-of-day conversion.
- Operations that compare a financial date with today use the application calendar
  date; the current implementation evaluates that date in `America/Lima`.

## Transactions

- A transaction records a direction, positive amount, currency, description, category,
  and occurrence date. A note is optional.
- A transaction affects financial totals in the month containing its occurrence date.
- Changing a transaction's direction requires a category compatible with the new
  direction.

## Recurring transactions

- A recurring transaction is a schedule, not money already received or spent.
- Supported frequencies are weekly, monthly, and yearly, with a positive recurrence
  interval.
- A recurrence has a start date and may have an end date. The end date cannot precede
  the start date.
- A monthly recurrence preserves its anchor day when possible and uses the final valid
  day in shorter months. A yearly February 29 recurrence uses February 28 in a
  non-leap year.
- A recurrence is `ACTIVE`, `PAUSED`, or `FINISHED`.
- Creating a recurrence may optionally record its first occurrence when the start date
  is today or earlier.
- A recurring item affects dashboard totals only after an occurrence is recorded as a
  real transaction.
- A recurrence can have at most one recorded transaction for a given occurrence date.
- A recurrence whose next occurrence is after its end date is finished.
