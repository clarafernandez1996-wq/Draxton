"use server";

import { Area, Prisma, Priority, ProjectPhase, ProjectStatus, ProjectType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/auth";

const PHASE_VALUES: ProjectPhase[] = [
  "DEFINICION",
  "EJECUCION",
  "IMPLANTACION",
  "ESTABILIZACION",
];
const STATUS_VALUES: ProjectStatus[] = [
  "ACTIVE",
  "ON_HOLD",
  "BLOCKED",
  "DONE",
  "CANCELED",
];
const TYPE_VALUES: ProjectType[] = ["ESTRATEGICO", "TACTICO", "OPERATIVO"];
const AREA_VALUES: Area[] = ["IT", "RRHH", "INGENIERIA"];
const PRIORITY_VALUES: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function parsePhase(value: string): ProjectPhase {
  return PHASE_VALUES.includes(value as ProjectPhase) ? (value as ProjectPhase) : "DEFINICION";
}

function parseStatus(value: string): ProjectStatus {
  return STATUS_VALUES.includes(value as ProjectStatus) ? (value as ProjectStatus) : "ACTIVE";
}

function parsePriority(value: string): Priority {
  return PRIORITY_VALUES.includes(value as Priority) ? (value as Priority) : "MEDIUM";
}

function parseType(value: string): ProjectType {
  if (value === "STRATEGIC") return "ESTRATEGICO";
  if (value === "TACTICAL") return "TACTICO";
  if (value === "OPERATIONAL") return "OPERATIVO";
  return TYPE_VALUES.includes(value as ProjectType) ? (value as ProjectType) : "OPERATIVO";
}

function parseArea(value: string): Area {
  return AREA_VALUES.includes(value as Area) ? (value as Area) : "IT";
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const projectCode = String(formData.get("projectCode") ?? "").trim();

  if (!name || !projectCode) {
    redirect("/projects/new?error=required");
  }

  const area = parseArea(String(formData.get("area") ?? "IT"));
  const projectType = parseType(String(formData.get("projectType") ?? "OPERATIVO"));
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const objective = String(formData.get("mainObjectives") ?? "").trim() || null;
  const scope = String(formData.get("businessCase") ?? "").trim() || null;
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));

  try {
    await prisma.project.create({
      data: {
        name,
        projectCode,
        code: projectCode,
        plant: "N/A",
        area,
        projectType,
        phase: "DEFINICION",
        status: "ACTIVE",
        priority: "MEDIUM",
        ownerName,
        description,
        objective,
        scope,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/projects/new?error=project_code_taken");
    }
    redirect("/projects/new?error=create_failed");
  }

  revalidatePath("/projects");
  redirect("/projects?success=created");
}

export async function updateProjectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const projectCode = String(formData.get("projectCode") ?? "").trim();

  if (!id) {
    redirect("/projects?error=missing_id");
  }

  if (!name || !projectCode) {
    redirect(`/projects/${id}/edit?error=required`);
  }

  const phase = parsePhase(String(formData.get("phase") ?? "DEFINICION"));
  const projectType = parseType(String(formData.get("projectType") ?? "OPERATIVO"));
  const area = parseArea(String(formData.get("area") ?? "IT"));
  const status = parseStatus(String(formData.get("status") ?? "ACTIVE"));
  const priority = parsePriority(String(formData.get("priority") ?? "MEDIUM"));
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const objective =
    String(formData.get("mainObjectives") ?? "").trim() ||
    String(formData.get("objective") ?? "").trim() ||
    null;
  const scope =
    String(formData.get("businessCase") ?? "").trim() ||
    String(formData.get("scope") ?? "").trim() ||
    null;
  const startDate = parseDate(String(formData.get("startDate") ?? ""));
  const endDate = parseDate(String(formData.get("endDate") ?? ""));

  try {
    const updated = await prisma.project.updateMany({
      where: { id },
      data: {
        name,
        code: projectCode,
        projectCode,
        area,
        projectType,
        phase,
        status,
        priority,
        ownerName,
        description,
        objective,
        scope,
        startDate,
        endDate,
      },
    });

    if (updated.count === 0) {
      redirect(`/projects/${id}/edit?error=not_found`);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`/projects/${id}/edit?error=project_code_taken`);
    }
    redirect(`/projects/${id}/edit?error=update_failed`);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}?success=updated`);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/projects?error=forbidden");
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/projects?error=missing_id");
  }

  try {
    const deleted = await prisma.project.deleteMany({
      where: { id },
    });

    if (deleted.count === 0) {
      redirect("/projects?error=not_found");
    }
  } catch {
    redirect(`/projects/${id}?error=delete_failed`);
  }

  revalidatePath("/projects");
  redirect("/projects?success=deleted");
}
