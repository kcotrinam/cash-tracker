import { BadRequestException } from '@nestjs/common';
import { RecurrenceFrequency } from '@prisma/client';

/** Date-only helpers. Noon UTC avoids a server/browser timezone changing a calendar date. */
export function parseDateOnly(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new BadRequestException('La fecha no es válida.');
  return date;
}

export function dateOnlyString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function applicationToday(timeZone = 'America/Lima') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return parseDateOnly(`${value.year}-${value.month}-${value.day}`);
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
}

export function nextScheduledDate(
  current: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  anchorDay?: number | null,
) {
  const year = current.getUTCFullYear();
  const month = current.getUTCMonth();
  if (frequency === RecurrenceFrequency.WEEKLY)
    return new Date(Date.UTC(year, month, current.getUTCDate() + interval * 7, 12));
  if (frequency === RecurrenceFrequency.MONTHLY) {
    const targetMonth = month + interval;
    const targetYear = year + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;
    const day = Math.min(
      anchorDay ?? current.getUTCDate(),
      daysInMonth(targetYear, normalizedMonth),
    );
    return new Date(Date.UTC(targetYear, normalizedMonth, day, 12));
  }
  const targetYear = year + interval;
  const day =
    month === 1 && current.getUTCDate() === 29 && daysInMonth(targetYear, 1) === 28
      ? 28
      : current.getUTCDate();
  return new Date(Date.UTC(targetYear, month, day, 12));
}

export function firstScheduledOnOrAfter(
  start: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  anchorDay: number | null,
  target: Date,
) {
  let candidate = start;
  while (candidate < target)
    candidate = nextScheduledDate(candidate, frequency, interval, anchorDay);
  return candidate;
}
