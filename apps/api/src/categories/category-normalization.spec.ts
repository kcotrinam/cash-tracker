import assert from 'node:assert/strict';
import test from 'node:test';
import { TransactionType } from '@prisma/client';
import { defaultCategories } from './category-defaults';
import { normalizeCategoryName } from './category-normalization';

test('normalizes accents, casing and whitespace for category comparison', () => {
  assert.equal(normalizeCategoryName(' Educación '), 'educacion');
  assert.equal(normalizeCategoryName('Comida   rápida'), 'comida rapida');
  assert.equal(normalizeCategoryName('EDUCACION'), 'educacion');
});

test('defines the ten idempotent defaults with the expected transaction types', () => {
  assert.equal(defaultCategories.length, 10);
  assert.equal(
    defaultCategories.filter((category) => category.type === TransactionType.INCOME)
      .length,
    3,
  );
  assert.equal(
    defaultCategories.filter((category) => category.type === TransactionType.EXPENSE)
      .length,
    7,
  );
  assert.ok(defaultCategories.some((category) => category.name === 'Otros gastos'));
  assert.ok(defaultCategories.some((category) => category.name === 'Otros ingresos'));
  assert.deepEqual(
    defaultCategories
      .filter((category) => 'isFallback' in category && category.isFallback)
      .map((category) => category.name),
    ['Otros ingresos', 'Otros gastos'],
  );
});
