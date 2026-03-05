"use server";

import { Priority, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export type TaskActionState = {
  ok: boolean;
  message: string;
};

const defaultState: TaskActionState = { ok: false, message: "" };

function parseDate(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parsePriority(value: FormDataEntryValue | null): Priority {
  const text = String(value ?? "MEDIUM");
  return text === "LOW" || text === "HIGH" || text === "CRITICAL" ? text : "MEDIUM";
}

function parseStatus(value: FormDataEntryValue | null): TaskStatus {
  const text = String(value ?? "NOT_STARTED");
  if (text === "IN_PROGRESS" || text === "DONE" || text === "BLOCKED" || text === "TODO") return text;
  return "NOT_STARTED";
}

function parseProgress(value: FormDataEntryValue | null): number {
  const num = Number(value ?? "0");
  if (Number.isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return Math.round(num);
}

function taskStateFromProgress(status: TaskStatus, progress: number) {
  if (status === "DONE") return 100;
  return progress;
}

export async function createTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!projectId) return { ...defaultState, message: "Proyecto no válido." };
  if (title.length < 2) return { ...defaultState, message: "El título debe tener al menos 2 caracteres." };

  const plannedStart = parseDate(formData.get("plannedStart"));
  const plannedEnd = parseDate(formData.get("plannedEnd"));
  const actualStart = parseDate(formData.get("actualStart"));
  const actualEnd = parseDate(formData.get("actualEnd"));
  if (plannedStart && plannedEnd && plannedStart > plannedEnd) return { ...defaultState, message: "Fechas planificadas inválidas." };
  if (actualStart && actualEnd && actualStart > actualEnd) return { ...defaultState, message: "Fechas reales inválidas." };

  const status = parseStatus(formData.get("status"));
  const progressActual = taskStateFromProgress(status, parseProgress(formData.get("progressActual")));
  const priority = parsePriority(formData.get("priority"));
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null;
  const comments = String(formData.get("comments") ?? "").trim() || null;

  await prisma.task.create({
    data: {
      projectId,
      title,
      ownerName,
      priority,
      status,
      dueDate: plannedEnd,
      plannedStart,
      plannedEnd,
      actualStart,
      actualEnd,
      startPlanned: plannedStart,
      endPlanned: plannedEnd,
      startReal: actualStart,
      endReal: actualEnd,
      progressActual,
      progressReal: progressActual,
      progress: progressActual,
      comments,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Tarea creada." };
}

export async function updateTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!projectId || !taskId) return { ...defaultState, message: "Tarea no válida." };
  if (title.length < 2) return { ...defaultState, message: "El título debe tener al menos 2 caracteres." };

  const plannedStart = parseDate(formData.get("plannedStart"));
  const plannedEnd = parseDate(formData.get("plannedEnd"));
  const actualStart = parseDate(formData.get("actualStart"));
  const actualEnd = parseDate(formData.get("actualEnd"));
  if (plannedStart && plannedEnd && plannedStart > plannedEnd) return { ...defaultState, message: "Fechas planificadas inválidas." };
  if (actualStart && actualEnd && actualStart > actualEnd) return { ...defaultState, message: "Fechas reales inválidas." };

  const status = parseStatus(formData.get("status"));
  const progressActual = taskStateFromProgress(status, parseProgress(formData.get("progressActual")));
  const priority = parsePriority(formData.get("priority"));
  const ownerName = String(formData.get("ownerName") ?? "").trim() || null;
  const comments = String(formData.get("comments") ?? "").trim() || null;

  await prisma.task.updateMany({
    where: { id: taskId, projectId },
    data: {
      title,
      ownerName,
      priority,
      status,
      dueDate: plannedEnd,
      plannedStart,
      plannedEnd,
      actualStart,
      actualEnd,
      startPlanned: plannedStart,
      endPlanned: plannedEnd,
      startReal: actualStart,
      endReal: actualEnd,
      progressActual,
      progressReal: progressActual,
      progress: progressActual,
      comments,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Tarea actualizada." };
}

export async function quickUpdateTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!projectId || !taskId) return { ...defaultState, message: "Tarea no válida." };

  const status = parseStatus(formData.get("status"));
  const progressActual = taskStateFromProgress(status, parseProgress(formData.get("progressActual")));
  const actualStart = parseDate(formData.get("actualStart"));
  const actualEnd = parseDate(formData.get("actualEnd"));
  if (actualStart && actualEnd && actualStart > actualEnd) return { ...defaultState, message: "Fechas reales inválidas." };

  await prisma.task.updateMany({
    where: { id: taskId, projectId },
    data: {
      status,
      progressActual,
      progressReal: progressActual,
      progress: progressActual,
      actualStart,
      actualEnd,
      startReal: actualStart,
      endReal: actualEnd,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Fila actualizada." };
}

export async function deleteTaskAction(_prevState: TaskActionState, formData: FormData): Promise<TaskActionState> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return { ...defaultState, message: "Solo Admin puede eliminar tareas." };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!projectId || !taskId) return { ...defaultState, message: "Tarea no válida." };

  await prisma.task.deleteMany({
    where: { id: taskId, projectId },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Tarea eliminada." };
}
