import assert from 'node:assert/strict';
import test from 'node:test';
import { RecurrenceFrequency } from '@prisma/client';
import { dateOnlyString, nextScheduledDate, parseDateOnly } from './recurrence-date';

test('monthly schedules return to their original end-of-month anchor', () => {
  const january = parseDateOnly('2026-01-31');
  const february = nextScheduledDate(january, RecurrenceFrequency.MONTHLY, 1, 31);
  const march = nextScheduledDate(february, RecurrenceFrequency.MONTHLY, 1, 31);
  assert.equal(dateOnlyString(february), '2026-02-28');
  assert.equal(dateOnlyString(march), '2026-03-31');
});

test('yearly leap day schedules use February 28 in non-leap years', () => {
  assert.equal(
    dateOnlyString(
      nextScheduledDate(parseDateOnly('2024-02-29'), RecurrenceFrequency.YEARLY, 1),
    ),
    '2025-02-28',
  );
});

test('weekly schedules advance by whole calendar weeks', () => {
  assert.equal(
    dateOnlyString(
      nextScheduledDate(parseDateOnly('2026-08-17'), RecurrenceFrequency.WEEKLY, 2),
    ),
    '2026-08-31',
  );
});
