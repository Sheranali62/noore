CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "RateLimitBucket_updatedAt_idx" ON "RateLimitBucket"("updatedAt");
ALTER TABLE "RateLimitBucket" ENABLE ROW LEVEL SECURITY;
