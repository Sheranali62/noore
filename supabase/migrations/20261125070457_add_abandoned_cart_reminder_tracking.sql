ALTER TABLE "Cart" ADD COLUMN "abandonedReminderAt" timestamp(3);
CREATE INDEX "Cart_updatedAt_abandonedReminderAt_idx" ON "Cart"("updatedAt","abandonedReminderAt");
