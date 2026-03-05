ALTER TABLE "Task" ADD COLUMN "deliverableCode" TEXT;
ALTER TABLE "Task" ADD COLUMN "progressPlanned" INTEGER NOT NULL DEFAULT 0;

UPDATE "Task"
SET "deliverableCode" = "deliverableIds"
WHERE "deliverableCode" IS NULL AND "deliverableIds" IS NOT NULL;
