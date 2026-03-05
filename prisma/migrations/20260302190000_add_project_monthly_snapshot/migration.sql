CREATE TABLE "ProjectMonthlySnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "scheduleRag" TEXT NOT NULL,
    "costRag" TEXT NOT NULL,
    "scopeRag" TEXT NOT NULL,
    "riskRag" TEXT NOT NULL,
    "supplierRag" TEXT NOT NULL,
    "executiveComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMonthlySnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectMonthlySnapshot_projectId_period_key" ON "ProjectMonthlySnapshot"("projectId", "period");
CREATE INDEX "ProjectMonthlySnapshot_projectId_period_idx" ON "ProjectMonthlySnapshot"("projectId", "period");

ALTER TABLE "ProjectMonthlySnapshot"
  ADD CONSTRAINT "ProjectMonthlySnapshot_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
