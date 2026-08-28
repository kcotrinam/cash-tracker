import assert from 'node:assert/strict';
import test from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurrencyCode } from '@prisma/client';
import { CreditCardsService } from './credit-cards.service';

function service(
  card: { userId: string; isActive: boolean; currency: CurrencyCode } | null,
) {
  return new CreditCardsService({
    creditCard: { findFirst: async () => card },
  } as never);
}

test('credit-card transaction validation enforces ownership, activity, and currency', async () => {
  await assert.rejects(
    () => service(null).assertUsable('user-a', 'card-a', CurrencyCode.PEN),
    NotFoundException,
  );
  await assert.rejects(
    () =>
      service({
        userId: 'user-a',
        isActive: false,
        currency: CurrencyCode.PEN,
      }).assertUsable('user-a', 'card-a', CurrencyCode.PEN),
    BadRequestException,
  );
  await assert.rejects(
    () =>
      service({
        userId: 'user-a',
        isActive: true,
        currency: CurrencyCode.USD,
      }).assertUsable('user-a', 'card-a', CurrencyCode.PEN),
    BadRequestException,
  );
  await assert.doesNotReject(() =>
    service({
      userId: 'user-a',
      isActive: true,
      currency: CurrencyCode.PEN,
    }).assertUsable('user-a', 'card-a', CurrencyCode.PEN),
  );
});
