"use server";

import { DeliverableStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

export type DeliverableActionState = {
  ok: boolean;
  message: string;
};

const defaultState: DeliverableActionState = { ok: false, message: "" };

function parseDate(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseStatus(value: FormDataEntryValue | null): DeliverableStatus {
  const text = String(value ?? "NOT_STARTED");
  if (text === "IN_PROGRESS" || text === "IN_REVIEW" || text === "DELIVERED") return text;
  return "NOT_STARTED";
}

export async function createDeliverableItemAction(
  _prevState: DeliverableActionState,
  formData: FormData,
): Promise<DeliverableActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!projectId) return { ...defaultState, message: "Proyecto no válido." };
  if (name.length < 2) return { ...defaultState, message: "El nombre del entregable es obligatorio." };

  const rawTaskId = String(formData.get("taskId") ?? "").trim();
  const taskId = rawTaskId || null;

  await prisma.projectDeliverableItem.create({
    data: {
      projectId,
      taskId,
      name,
      status: parseStatus(formData.get("status")),
      committedDate: parseDate(formData.get("committedDate")),
      ownerName: String(formData.get("ownerName") ?? "").trim() || null,
      sharepointLink: String(formData.get("sharepointLink") ?? "").trim() || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Entregable creado." };
}
