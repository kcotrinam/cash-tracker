ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Lima';
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "isFallback" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Category"
SET "isFallback" = true
WHERE ("type" = 'INCOME' AND "normalizedName" = 'otros ingresos')
   OR ("type" = 'EXPENSE' AND "normalizedName" = 'otros gastos');

INSERT INTO "UserSettings" ("userId", "defaultCurrency", "timezone", "createdAt", "updatedAt")
SELECT "id", 'PEN', 'America/Lima', NOW(), NOW()
FROM "User"
ON CONFLICT ("userId") DO NOTHING;
