CREATE TABLE "ProjectFinanceSummary" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "budgetApproved" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "committedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "economicRiskNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectFinanceSummary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectFinanceEntry" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "supplier" TEXT,
  "ownerName" TEXT,
  "leverage" TEXT,
  "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "actualAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "probability" INTEGER,
  "weightedAmount" DOUBLE PRECISION,
  "capex" DOUBLE PRECISION,
  "opexAnnual" DOUBLE PRECISION,
  "paybackYears" DOUBLE PRECISION,
  "roiPercent" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectFinanceEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectFinanceSummary_projectId_key" ON "ProjectFinanceSummary"("projectId");
CREATE INDEX "ProjectFinanceEntry_projectId_idx" ON "ProjectFinanceEntry"("projectId");
CREATE INDEX "ProjectFinanceEntry_type_idx" ON "ProjectFinanceEntry"("type");

ALTER TABLE "ProjectFinanceSummary"
  ADD CONSTRAINT "ProjectFinanceSummary_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectFinanceEntry"
  ADD CONSTRAINT "ProjectFinanceEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
