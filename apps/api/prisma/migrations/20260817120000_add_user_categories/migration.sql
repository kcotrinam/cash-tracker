-- Categories are user-owned. Stop rather than guessing how to reassign legacy
-- shared categories, because their transaction relationships must be preserved.
DO $$
DECLARE
  conflicting_ids TEXT;
BEGIN
  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
  INTO conflicting_ids
  FROM "Category"
  WHERE "userId" IS NULL;

  IF conflicting_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot migrate shared categories without an owner. Category IDs: %', conflicting_ids;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Category"
  ADD COLUMN "normalizedName" TEXT,
  ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Category"
SET "normalizedName" = lower(regexp_replace(btrim(unaccent("name")), '\\s+', ' ', 'g'));

DO $$
DECLARE
  conflicts TEXT;
BEGIN
  SELECT string_agg("id"::TEXT, ', ' ORDER BY "id")
  INTO conflicts
  FROM (
    SELECT "id"
    FROM "Category"
    WHERE "normalizedName" IS NOT NULL
      AND ("userId", "type", "normalizedName") IN (
        SELECT "userId", "type", "normalizedName"
        FROM "Category"
        GROUP BY "userId", "type", "normalizedName"
        HAVING count(*) > 1
      )
  ) duplicate_categories;

  IF conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Normalized duplicate categories require explicit resolution. Category IDs: %', conflicts;
  END IF;
END $$;

ALTER TABLE "Category"
  ALTER COLUMN "normalizedName" SET NOT NULL,
  ALTER COLUMN "userId" SET NOT NULL;

CREATE UNIQUE INDEX "Category_userId_type_normalizedName_key"
  ON "Category"("userId", "type", "normalizedName");

-- Backfill defaults for established users, while preserving all existing rows.
INSERT INTO "Category" ("id", "userId", "name", "normalizedName", "type", "isDefault", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u."id", d."name", d."normalizedName", d."type"::"TransactionType", true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN (
  VALUES
    ('Salario', 'salario', 'INCOME'),
    ('Freelance', 'freelance', 'INCOME'),
    ('Otros ingresos', 'otros ingresos', 'INCOME'),
    ('Vivienda', 'vivienda', 'EXPENSE'),
    ('Alimentación', 'alimentacion', 'EXPENSE'),
    ('Transporte', 'transporte', 'EXPENSE'),
    ('Servicios', 'servicios', 'EXPENSE'),
    ('Salud', 'salud', 'EXPENSE'),
    ('Entretenimiento', 'entretenimiento', 'EXPENSE'),
    ('Otros gastos', 'otros gastos', 'EXPENSE')
) AS d("name", "normalizedName", "type")
ON CONFLICT ("userId", "type", "normalizedName") DO NOTHING;
