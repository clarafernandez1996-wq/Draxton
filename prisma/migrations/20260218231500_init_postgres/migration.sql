-- Enums
CREATE TYPE "ProjectPhase" AS ENUM (
  'IDEA',
  'DESIGN',
  'INDUSTRIALIZATION',
  'VALIDATION',
  'SOP',
  'CLOSED'
);

CREATE TYPE "ProjectStatus" AS ENUM (
  'ACTIVE',
  'ON_HOLD',
  'BLOCKED',
  'DONE',
  'CANCELED'
);

CREATE TYPE "Priority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "TaskStatus" AS ENUM (
  'TODO',
  'IN_PROGRESS',
  'DONE'
);

CREATE TYPE "RiskStatus" AS ENUM (
  'OPEN',
  'CLOSED'
);

CREATE TYPE "Role" AS ENUM (
  'ADMIN',
  'USER'
);

-- Tables
CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "plant" TEXT NOT NULL,
  "phase" "ProjectPhase" NOT NULL DEFAULT 'IDEA',
  "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "ownerName" TEXT,
  "description" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Risk" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
  "probability" INTEGER NOT NULL DEFAULT 3,
  "impact" INTEGER NOT NULL DEFAULT 3,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Risk_projectId_idx" ON "Risk"("projectId");
CREATE INDEX "Risk_status_idx" ON "Risk"("status");
CREATE INDEX "Risk_probability_impact_idx" ON "Risk"("probability", "impact");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- FKs
ALTER TABLE "Task"
ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Risk"
ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session"
ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
