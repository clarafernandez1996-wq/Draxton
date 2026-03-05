CREATE TABLE "ProjectDeliverableItem" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "taskId" TEXT,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "committedDate" TIMESTAMP(3),
  "ownerName" TEXT,
  "sharepointLink" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectDeliverableItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectDeliverableItem_projectId_idx" ON "ProjectDeliverableItem"("projectId");
CREATE INDEX "ProjectDeliverableItem_taskId_idx" ON "ProjectDeliverableItem"("taskId");
CREATE INDEX "ProjectDeliverableItem_status_idx" ON "ProjectDeliverableItem"("status");

ALTER TABLE "ProjectDeliverableItem"
  ADD CONSTRAINT "ProjectDeliverableItem_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectDeliverableItem"
  ADD CONSTRAINT "ProjectDeliverableItem_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
