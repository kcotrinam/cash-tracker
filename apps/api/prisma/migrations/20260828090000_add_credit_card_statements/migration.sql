CREATE TYPE "CreditCardStatementStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

CREATE TABLE "CreditCardStatement" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "creditCardId" UUID NOT NULL,
  "periodStart" DATE NOT NULL,
  "closedOn" DATE NOT NULL,
  "dueOn" DATE NOT NULL,
  "statementBalance" DECIMAL(19,4) NOT NULL,
  "minimumPayment" DECIMAL(19,4),
  "remainingBalance" DECIMAL(19,4) NOT NULL,
  "status" "CreditCardStatementStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "CreditCardStatement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditCardPaymentApplication" (
  "id" UUID NOT NULL,
  "paymentId" UUID NOT NULL,
  "statementId" UUID NOT NULL,
  "amount" DECIMAL(19,4) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreditCardPaymentApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CreditCardStatement_creditCardId_closedOn_key" ON "CreditCardStatement"("creditCardId", "closedOn");
CREATE INDEX "CreditCardStatement_userId_dueOn_status_idx" ON "CreditCardStatement"("userId", "dueOn", "status");
CREATE UNIQUE INDEX "CreditCardPaymentApplication_paymentId_statementId_key" ON "CreditCardPaymentApplication"("paymentId", "statementId");
CREATE INDEX "CreditCardPaymentApplication_statementId_idx" ON "CreditCardPaymentApplication"("statementId");

ALTER TABLE "CreditCardStatement" ADD CONSTRAINT "CreditCardStatement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditCardStatement" ADD CONSTRAINT "CreditCardStatement_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditCardPaymentApplication" ADD CONSTRAINT "CreditCardPaymentApplication_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CreditCardPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreditCardPaymentApplication" ADD CONSTRAINT "CreditCardPaymentApplication_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "CreditCardStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditCardStatement"
  ADD CONSTRAINT "CreditCardStatement_balances_nonnegative" CHECK ("statementBalance" >= 0 AND "remainingBalance" >= 0),
  ADD CONSTRAINT "CreditCardStatement_minimumPayment_valid" CHECK ("minimumPayment" IS NULL OR ("minimumPayment" > 0 AND "minimumPayment" <= "statementBalance")),
  ADD CONSTRAINT "CreditCardStatement_dates_valid" CHECK ("periodStart" <= "closedOn" AND "dueOn" >= "closedOn");
ALTER TABLE "CreditCardPaymentApplication"
  ADD CONSTRAINT "CreditCardPaymentApplication_amount_positive" CHECK ("amount" > 0);
