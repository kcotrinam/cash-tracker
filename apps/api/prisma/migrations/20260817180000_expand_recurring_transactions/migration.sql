-- Evolve the original monthly-rule model without losing any existing rules or
-- recorded transactions. Existing rules remain monthly and retain their date.
DO $$
BEGIN
  CREATE TYPE "RecurrenceFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE "RecurringTransactionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'FINISHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Transaction' AND column_name = 'sourceRecurringTransactionId') THEN
    ALTER TABLE "Transaction" RENAME COLUMN "sourceRecurringTransactionId" TO "recurringTransactionId";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Transaction_sourceRecurringTransactionId_fkey') THEN
    ALTER TABLE "Transaction" RENAME CONSTRAINT "Transaction_sourceRecurringTransactionId_fkey" TO "Transaction_recurringTransactionId_fkey";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecurringTransaction' AND column_name = 'name') THEN
    ALTER TABLE "RecurringTransaction" RENAME COLUMN "name" TO "description";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecurringTransaction' AND column_name = 'currencyCode') THEN
    ALTER TABLE "RecurringTransaction" RENAME COLUMN "currencyCode" TO "currency";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecurringTransaction' AND column_name = 'startsOn') THEN
    ALTER TABLE "RecurringTransaction" RENAME COLUMN "startsOn" TO "startDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecurringTransaction' AND column_name = 'endsOn') THEN
    ALTER TABLE "RecurringTransaction" RENAME COLUMN "endsOn" TO "endDate";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecurringTransaction' AND column_name = 'notes') THEN
    ALTER TABLE "RecurringTransaction" RENAME COLUMN "notes" TO "note";
  END IF;
END $$;

ALTER TABLE "RecurringTransaction"
  ADD COLUMN IF NOT EXISTS "frequency" "RecurrenceFrequency" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "interval" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "nextOccurrenceDate" DATE,
  ADD COLUMN IF NOT EXISTS "anchorDay" INTEGER,
  ADD COLUMN IF NOT EXISTS "status" "RecurringTransactionStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "RecurringTransaction"
SET "nextOccurrenceDate" = "startDate",
    "anchorDay" = "billingDay",
    "status" = CASE WHEN "isActive" THEN 'ACTIVE'::"RecurringTransactionStatus" ELSE 'PAUSED'::"RecurringTransactionStatus" END;

ALTER TABLE "RecurringTransaction"
  ALTER COLUMN "nextOccurrenceDate" SET NOT NULL,
  DROP COLUMN "billingDay",
  DROP COLUMN "isActive",
  DROP CONSTRAINT IF EXISTS "RecurringTransaction_billingDay_valid",
  DROP CONSTRAINT IF EXISTS "RecurringTransaction_date_range_valid",
  ADD CONSTRAINT "RecurringTransaction_interval_positive" CHECK ("interval" >= 1),
  ADD CONSTRAINT "RecurringTransaction_anchorDay_valid" CHECK ("anchorDay" IS NULL OR "anchorDay" BETWEEN 1 AND 31),
  ADD CONSTRAINT "RecurringTransaction_date_range_valid" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

DROP INDEX IF EXISTS "RecurringTransaction_userId_type_isActive_billingDay_idx";
CREATE INDEX IF NOT EXISTS "RecurringTransaction_userId_status_nextOccurrenceDate_idx"
  ON "RecurringTransaction"("userId", "status", "nextOccurrenceDate");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_recurringTransactionId_occurredOn_key"
  ON "Transaction"("recurringTransactionId", "occurredOn");
