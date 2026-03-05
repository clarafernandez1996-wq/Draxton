"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

export type FinanceActionState = {
  ok: boolean;
  message: string;
};

const defaultState: FinanceActionState = { ok: false, message: "" };

function parseNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return fallback;
  const num = Number(raw);
  if (Number.isNaN(num)) return fallback;
  return num;
}

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function parseType(value: FormDataEntryValue | null): "COST" | "INCOME" | "BENEFIT" {
  const text = String(value ?? "COST");
  if (text === "INCOME") return "INCOME";
  if (text === "BENEFIT") return "BENEFIT";
  return "COST";
}

export async function upsertFinanceSummaryAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { ...defaultState, message: "Proyecto no válido." };

  await prisma.projectFinanceSummary.upsert({
    where: { projectId },
    create: {
      projectId,
      budgetApproved: parseNumber(formData.get("budgetApproved")),
      actualCost: parseNumber(formData.get("actualCost")),
      committedCost: parseNumber(formData.get("committedCost")),
      economicRiskNote: String(formData.get("economicRiskNote") ?? "").trim() || null,
    },
    update: {
      budgetApproved: parseNumber(formData.get("budgetApproved")),
      actualCost: parseNumber(formData.get("actualCost")),
      committedCost: parseNumber(formData.get("committedCost")),
      economicRiskNote: String(formData.get("economicRiskNote") ?? "").trim() || null,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Resumen económico actualizado." };
}

export async function createFinanceEntryAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!projectId) return { ...defaultState, message: "Proyecto no válido." };
  if (category.length < 2) return { ...defaultState, message: "La partida debe tener al menos 2 caracteres." };

  const type = parseType(formData.get("type"));
  const budgetAmount = parseNumber(formData.get("budgetAmount"));
  const actualAmount = parseNumber(formData.get("actualAmount"));
  const probability = parseIntOrNull(formData.get("probability"));
  const weightedAmount = probability === null ? null : (actualAmount * probability) / 100;

  await prisma.projectFinanceEntry.create({
    data: {
      projectId,
      type,
      category,
      description: String(formData.get("description") ?? "").trim() || null,
      supplier: String(formData.get("supplier") ?? "").trim() || null,
      ownerName: String(formData.get("ownerName") ?? "").trim() || null,
      leverage: String(formData.get("leverage") ?? "").trim() || null,
      budgetAmount,
      actualAmount,
      probability,
      weightedAmount,
      capex: parseNumber(formData.get("capex"), 0),
      opexAnnual: parseNumber(formData.get("opexAnnual"), 0),
      paybackYears: parseNumber(formData.get("paybackYears"), 0),
      roiPercent: parseNumber(formData.get("roiPercent"), 0),
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true, message: "Partida económica añadida." };
}
