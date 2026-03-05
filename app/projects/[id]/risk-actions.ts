"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

export type RiskActionState = {
  ok: boolean;
  message: string;
};

const defaultState: RiskActionState = { ok: false, message: "" };

function parseDate(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseScale(value: FormDataEntryValue | null, fallback = 3): number {
  const num = Number(value ?? fallback);
  if (Number.isNaN(num)) return fallback;
  if (num < 1) return 1;
  if (num > 5) return 5;
  return Math.round(num);
}

export async function createRiskAction(_prevState: RiskActionState, formData: FormData): Promise<RiskActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!projectId) return { ...defaultState, message: "Proyecto no válido." };
  if (title.length < 2) return { ...defaultState, message: "El título debe tener al menos 2 caracteres." };

  await prisma.risk.create({
    data: {
      projectId,
      title,
      ownerName: String(formData.get("ownerName") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      mitigationPlan: String(formData.get("mitigationPlan") ?? "").trim() || null,
      targetDate: parseDate(formData.get("targetDate")),
      probability: parseScale(formData.get("probability"), 3),
      impact: parseScale(formData.get("impact"), 3),
      status: "OPEN",
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Riesgo creado." };
}
