-- CreateTable
CREATE TABLE "CreditCard" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "creditLimit" DECIMAL(19,4) NOT NULL,
    "initialBalance" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "closingDay" INTEGER NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCardPayment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "creditCardId" UUID NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" "CurrencyCode" NOT NULL,
    "paidOn" DATE NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CreditCardPayment_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "creditCardId" UUID;

-- CreateIndex
CREATE INDEX "Transaction_creditCardId_occurredOn_idx" ON "Transaction"("creditCardId", "occurredOn");

-- CreateIndex
CREATE INDEX "CreditCard_userId_currency_isActive_idx" ON "CreditCard"("userId", "currency", "isActive");

-- CreateIndex
CREATE INDEX "CreditCardPayment_userId_paidOn_currency_idx" ON "CreditCardPayment"("userId", "paidOn", "currency");

-- CreateIndex
CREATE INDEX "CreditCardPayment_creditCardId_paidOn_idx" ON "CreditCardPayment"("creditCardId", "paidOn");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPayment" ADD CONSTRAINT "CreditCardPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardPayment" ADD CONSTRAINT "CreditCardPayment_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma does not model PostgreSQL CHECK constraints. Keep card financial and
-- calendar invariants in the database so they hold for every writer.
ALTER TABLE "CreditCard"
  ADD CONSTRAINT "CreditCard_creditLimit_positive" CHECK ("creditLimit" > 0),
  ADD CONSTRAINT "CreditCard_initialBalance_nonnegative" CHECK ("initialBalance" >= 0),
  ADD CONSTRAINT "CreditCard_closingDay_valid" CHECK ("closingDay" BETWEEN 1 AND 31),
  ADD CONSTRAINT "CreditCard_paymentDay_valid" CHECK ("paymentDay" BETWEEN 1 AND 31);

ALTER TABLE "CreditCardPayment"
  ADD CONSTRAINT "CreditCardPayment_amount_positive" CHECK ("amount" > 0);
