CREATE TYPE "ReturnRequestStatus" AS ENUM ('REQUESTED','APPROVED','REJECTED','PICKUP_SCHEDULED','RECEIVED','REFUNDED','EXCHANGED');

ALTER TABLE "NewsletterSubscriber"
  ADD COLUMN "active" boolean NOT NULL DEFAULT true,
  ADD COLUMN "unsubscribeToken" text,
  ADD COLUMN "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
CREATE INDEX "NewsletterSubscriber_active_createdAt_idx" ON "NewsletterSubscriber"("active","createdAt");

CREATE TABLE "ReturnRequest" (
  "id" text PRIMARY KEY,
  "orderId" text NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason" text NOT NULL,
  "details" text,
  "itemIds" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "evidence" text[] NOT NULL DEFAULT ARRAY[]::text[],
  "status" "ReturnRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "adminNote" text,
  "refundAmount" double precision,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ReturnRequest_userId_createdAt_idx" ON "ReturnRequest"("userId","createdAt");
CREATE INDEX "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");
CREATE INDEX "ReturnRequest_status_createdAt_idx" ON "ReturnRequest"("status","createdAt");

CREATE TABLE "PaymentTransaction" (
  "id" text PRIMARY KEY,
  "orderId" text NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "providerReference" text,
  "amount" double precision NOT NULL,
  "currency" text NOT NULL DEFAULT 'PKR',
  "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "rawResponse" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "PaymentTransaction_provider_providerReference_key" ON "PaymentTransaction"("provider","providerReference");
CREATE INDEX "PaymentTransaction_orderId_createdAt_idx" ON "PaymentTransaction"("orderId","createdAt");

CREATE TABLE "OrderEvent" (
  "id" text PRIMARY KEY,
  "orderId" text NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
  "actorId" text,
  "event" text NOT NULL,
  "message" text,
  "metadata" jsonb,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId","createdAt");

CREATE TABLE "AuditLog" (
  "id" text PRIMARY KEY,
  "actorId" text,
  "action" text NOT NULL,
  "entityType" text NOT NULL,
  "entityId" text,
  "details" jsonb,
  "ipAddress" text,
  "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId","createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType","entityId");

ALTER TABLE "ReturnRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
