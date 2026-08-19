import assert from 'node:assert/strict';
import test from 'node:test';
import { AppLanguage, TransactionType } from '@prisma/client';
import { defaultCategories } from './category-defaults';
import { normalizeCategoryName } from './category-normalization';

test('normalizes accents, casing and whitespace for category comparison', () => {
  assert.equal(normalizeCategoryName(' Educación '), 'educacion');
  assert.equal(normalizeCategoryName('Comida   rápida'), 'comida rapida');
  assert.equal(normalizeCategoryName('EDUCACION'), 'educacion');
});

test('defines the ten idempotent defaults with the expected transaction types', () => {
  const categories = defaultCategories(AppLanguage.EN);
  assert.equal(categories.length, 10);
  assert.equal(
    categories.filter((category) => category.type === TransactionType.INCOME).length,
    3,
  );
  assert.equal(
    categories.filter((category) => category.type === TransactionType.EXPENSE).length,
    7,
  );
  assert.ok(categories.some((category) => category.name === 'Other expenses'));
  assert.ok(categories.some((category) => category.name === 'Other income'));
  assert.deepEqual(
    categories
      .filter((category) => 'isFallback' in category && category.isFallback)
      .map((category) => category.name),
    ['Other income', 'Other expenses'],
  );
});

test('localizes defaults from stable category keys', () => {
  const categories = defaultCategories(AppLanguage.ES);
  assert.equal(categories.find((category) => category.defaultKey === 'salary')?.name, 'Salario');
  assert.equal(categories.find((category) => category.defaultKey === 'other-expenses')?.name, 'Otros gastos');
});
