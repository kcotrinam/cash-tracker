CREATE TYPE "AppLanguage" AS ENUM ('EN', 'ES');

ALTER TABLE "UserSettings"
  ADD COLUMN "language" "AppLanguage" NOT NULL DEFAULT 'EN';

ALTER TABLE "Category"
  ADD COLUMN "defaultKey" TEXT;

UPDATE "Category"
SET "defaultKey" = CASE
  WHEN "type" = 'INCOME' AND "normalizedName" IN ('salario', 'salary') THEN 'salary'
  WHEN "type" = 'INCOME' AND "normalizedName" = 'freelance' THEN 'freelance'
  WHEN "type" = 'INCOME' AND "normalizedName" IN ('otros ingresos', 'other income') THEN 'other-income'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('vivienda', 'housing') THEN 'housing'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('alimentacion', 'food') THEN 'food'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('transporte', 'transport') THEN 'transport'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('servicios', 'utilities') THEN 'utilities'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('salud', 'health') THEN 'health'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('entretenimiento', 'entertainment') THEN 'entertainment'
  WHEN "type" = 'EXPENSE' AND "normalizedName" IN ('otros gastos', 'other expenses') THEN 'other-expenses'
END
WHERE "isDefault" = true OR "isFallback" = true;

UPDATE "Category"
SET
  "name" = CASE "defaultKey"
    WHEN 'salary' THEN 'Salary'
    WHEN 'freelance' THEN 'Freelance'
    WHEN 'other-income' THEN 'Other income'
    WHEN 'housing' THEN 'Housing'
    WHEN 'food' THEN 'Food'
    WHEN 'transport' THEN 'Transport'
    WHEN 'utilities' THEN 'Utilities'
    WHEN 'health' THEN 'Health'
    WHEN 'entertainment' THEN 'Entertainment'
    WHEN 'other-expenses' THEN 'Other expenses'
  END,
  "normalizedName" = CASE "defaultKey"
    WHEN 'salary' THEN 'salary'
    WHEN 'freelance' THEN 'freelance'
    WHEN 'other-income' THEN 'other income'
    WHEN 'housing' THEN 'housing'
    WHEN 'food' THEN 'food'
    WHEN 'transport' THEN 'transport'
    WHEN 'utilities' THEN 'utilities'
    WHEN 'health' THEN 'health'
    WHEN 'entertainment' THEN 'entertainment'
    WHEN 'other-expenses' THEN 'other expenses'
  END
WHERE "defaultKey" IS NOT NULL;

CREATE UNIQUE INDEX "Category_userId_defaultKey_key"
  ON "Category"("userId", "defaultKey");
