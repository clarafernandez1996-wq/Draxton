import "server-only";

import { Priority, ProjectPhase, RagLevel } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { CommitteeMetrics, DashboardData, DashboardFilters, PortfolioRow, TrendPoint } from "./types";

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthPeriod(base: Date, deltaMonths = 0) {
  const date = new Date(base.getFullYear(), base.getMonth() + deltaMonths, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parsePeriod(period: string | undefined) {
  if (period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return period;
  return monthPeriod(new Date(), 0);
}

function ragSeverity(rag: RagLevel): number {
  if (rag === "RED") return 3;
  if (rag === "YELLOW") return 2;
  if (rag === "GREEN") return 1;
  return 1.5;
}

function ragScore(rag: RagLevel): number {
  if (rag === "RED") return 100;
  if (rag === "YELLOW") return 60;
  if (rag === "GREEN") return 20;
  return 40;
}

function ragTrend(current: RagLevel, previous: RagLevel | null): -1 | 0 | 1 | null {
  if (!previous) return null;
  const diff = ragSeverity(current) - ragSeverity(previous);
  if (diff > 0) return 1;
  if (diff < 0) return -1;
  return 0;
}

function priorityToScore(priority: Priority): number {
  if (priority === "CRITICAL") return 5;
  if (priority === "HIGH") return 4;
  if (priority === "MEDIUM") return 3;
  return 2;
}

function parseDateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value: Date | null): string {
  if (!value) return "-";
  return value.toISOString().slice(0, 10);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function buildPeriods(period: string) {
  const [yearRaw, monthRaw] = period.split("-");
  const base = new Date(Number(yearRaw), Number(monthRaw) - 1, 1);
  const list: string[] = [];
  for (let i = -5; i <= 0; i++) list.push(monthPeriod(base, i));
  return list;
}

function isValidPhase(input: string | undefined): input is ProjectPhase {
  return input === "DEFINICION" || input === "EJECUCION" || input === "IMPLANTACION" || input === "ESTABILIZACION";
}

function ragColor(rag: RagLevel) {
  if (rag === "RED") return "#C8102E";
  if (rag === "YELLOW") return "#F59E0B";
  if (rag === "GREEN") return "#16A34A";
  return "#6B7280";
}

export async function getDashboardData(input: DashboardFilters): Promise<DashboardData> {
  const period = parsePeriod(input.period);
  const periods6m = buildPeriods(period);
  const previousPeriod = periods6m[periods6m.length - 2] ?? period;
  const selectedPeriod = periods6m[periods6m.length - 1] ?? period;
  const where = {
    ...(input.area ? { area: input.area as "IT" | "RRHH" | "INGENIERIA" } : {}),
    ...(isValidPhase(input.phase) ? { phase: input.phase } : {}),
    ...(input.priority ? { priority: input.priority as Priority } : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    include: {
      tasks: true,
      risks: true,
      monthlySnapshots: {
        where: { period: { in: periods6m } },
        orderBy: { period: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const today = startOfDay();
  const staleCutoff = new Date(today.getTime() - 30 * 86400000);

  const portfolio = projects.map<PortfolioRow>((project) => {
    const snapshots = project.monthlySnapshots;
    const selectedSnapshot = snapshots.find((s) => s.period === selectedPeriod) ?? snapshots[snapshots.length - 1] ?? null;
    const previousSnapshot = snapshots.find((s) => s.period === previousPeriod) ?? null;
    const planningRag = selectedSnapshot?.scheduleRag ?? "NA";
    const costRag = selectedSnapshot?.costRag ?? "NA";
    const riskRag = selectedSnapshot?.riskRag ?? "NA";
    const supplierRag = selectedSnapshot?.supplierRag ?? "NA";
    const planningTrend = ragTrend(planningRag, previousSnapshot?.scheduleRag ?? null);
    const costTrend = ragTrend(costRag, previousSnapshot?.costRag ?? null);
    const progressValues = project.tasks.map((task) => task.progressActual ?? task.progressReal ?? Math.round(task.progress ?? 0));
    const progressPercent = Math.round(average(progressValues));
    const prevProgressProxy = previousSnapshot ? ragScore(previousSnapshot.scopeRag) : ragScore(selectedSnapshot?.scopeRag ?? "NA");
    const currentProgressProxy = ragScore(selectedSnapshot?.scopeRag ?? "NA");
    const progressTrend = currentProgressProxy > prevProgressProxy ? -1 : currentProgressProxy < prevProgressProxy ? 1 : 0;

    const openRisks = project.risks.filter((risk) => risk.status === "OPEN");
    const highRisks = openRisks.filter((risk) => risk.probability * risk.impact >= 15);
    const overdueTasks = project.tasks.filter((task) => {
      const due = parseDateOrNull(task.plannedEnd ?? task.endPlanned ?? task.dueDate);
      if (!due) return false;
      const status = task.status;
      return due < today && status !== "DONE";
    });

    let attentionScore = Math.round(
      ragScore(planningRag) * 0.35 + ragScore(costRag) * 0.25 + ragScore(riskRag) * 0.25 + ragScore(supplierRag) * 0.15,
    );
    attentionScore = Math.min(100, attentionScore + Math.min(20, highRisks.length * 5) + Math.min(15, overdueTasks.length * 3));

    const motives: string[] = [];
    if (planningRag === "RED") motives.push("Plazo en rojo");
    if (costRag === "RED") motives.push("Coste en rojo");
    if (riskRag === "RED") motives.push("Riesgo en rojo");
    if (highRisks.length > 0) motives.push(`Riesgos HIGH ${highRisks.length}`);
    if (overdueTasks.length > 0) motives.push(`Tareas vencidas ${overdueTasks.length}`);
    if (motives.length === 0 && attentionScore >= 70) motives.push("Atención alta");

    const trend6m = periods6m.map((periodKey) => {
      const snap = snapshots.find((s) => s.period === periodKey);
      const p = snap?.scheduleRag ?? "NA";
      const c = snap?.costRag ?? "NA";
      const r = snap?.riskRag ?? "NA";
      const attention = Math.round(ragScore(p) * 0.35 + ragScore(c) * 0.25 + ragScore(r) * 0.25 + ragScore(snap?.supplierRag ?? "NA") * 0.15);
      return { period: periodKey, planning: p, cost: c, risk: r, attention };
    });

    const topHighRisks = highRisks
      .map((risk) => ({ title: risk.title, score: risk.probability * risk.impact }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const upcomingTasks = project.tasks
      .map((task) => ({
        title: task.title,
        due: parseDateOrNull(task.plannedEnd ?? task.endPlanned ?? task.dueDate),
      }))
      .filter((task) => task.due)
      .sort((a, b) => (a.due!.getTime() - b.due!.getTime()))
      .slice(0, 3)
      .map((task) => ({ title: task.title, due: toIsoDate(task.due) }));

    return {
      projectId: project.id,
      project: project.name,
      area: project.area,
      owner: project.ownerName ?? "-",
      phase: project.phase,
      plannedEnd: toIsoDate(parseDateOrNull(project.plannedEndDate ?? project.endDate)),
      lastUpdate: toIsoDate(project.updatedAt),
      priorityScore: priorityToScore(project.priority),
      planningRag,
      planningTrend,
      costRag,
      costTrend,
      progressPercent,
      progressTrend,
      riskRag,
      riskHigh: highRisks.length,
      riskTotal: openRisks.length,
      supplierRag,
      supplierName: project.ownerName ?? "Sin proveedor",
      attentionScore,
      motives,
      attentionHigh: attentionScore >= 70,
      stale30d: project.updatedAt < staleCutoff,
      anyRed: planningRag === "RED" || costRag === "RED" || riskRag === "RED" || supplierRag === "RED",
      trend6m,
      topHighRisks,
      upcomingTasks,
    };
  });

  const riskTotal = portfolio.reduce((acc, row) => acc + row.riskTotal, 0);
  const riskHigh = portfolio.reduce((acc, row) => acc + row.riskHigh, 0);
  const avgAttention = portfolio.length ? average(portfolio.map((row) => row.attentionScore)) : 0;
  const healthIndex = Math.max(0, Math.round(100 - avgAttention));

  const ragInit: Record<RagLevel, number> = { GREEN: 0, YELLOW: 0, RED: 0, NA: 0 };
  const ragByDimension = {
    planning: { ...ragInit },
    cost: { ...ragInit },
    risk: { ...ragInit },
  };
  for (const row of portfolio) {
    ragByDimension.planning[row.planningRag] += 1;
    ragByDimension.cost[row.costRag] += 1;
    ragByDimension.risk[row.riskRag] += 1;
  }

  const trend6m: TrendPoint[] = periods6m.map((periodKey) => {
    const count = portfolio.filter((row) => {
      const point = row.trend6m.find((item) => item.period === periodKey);
      return (point?.attention ?? 0) >= 70;
    }).length;
    return { period: periodKey, attentionHigh: count };
  });

  const topAttention = [...portfolio].sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 10);

  const bubbles = portfolio.slice(0, 20).map((row) => {
    const project = projects.find((p) => p.id === row.projectId);
    const open = (project?.risks ?? []).filter((risk) => risk.status === "OPEN");
    const xProbability = Math.round(average(open.map((risk) => risk.probability)) || 1);
    const yImpact = Math.round(average(open.map((risk) => risk.impact)) || 1);
    return {
      project: row.project,
      xProbability,
      yImpact,
      size: Math.max(10, Math.min(48, Math.round(row.attentionScore / 2))),
      color: ragColor(row.riskRag),
    };
  });

  const withOwner = portfolio.filter((row) => row.owner && row.owner !== "-").length;
  const updated30d = portfolio.filter((row) => !row.stale30d).length;
  const withSnapshot = portfolio.filter((row) => row.trend6m.some((point) => point.period === selectedPeriod && point.planning !== "NA")).length;
  const safePct = (num: number, den: number) => (den === 0 ? 0 : Math.round((num / den) * 100));

  const alerts = topAttention
    .filter((row) => row.attentionScore >= 70)
    .slice(0, 6)
    .map((row) => ({ project: row.project, score: row.attentionScore, reasons: row.motives.slice(0, 3) }));

  const committee: CommitteeMetrics = {
    healthIndex,
    riskPercent: safePct(riskHigh, Math.max(1, riskTotal)),
    highAttentionProjects: portfolio.filter((row) => row.attentionHigh).length,
    highRisks: riskHigh,
    ragByDimension,
    trend6m,
    topAttention,
    bubbles,
    hygiene: {
      withOwnerPct: safePct(withOwner, portfolio.length),
      updated30dPct: safePct(updated30d, portfolio.length),
      withSnapshotPct: safePct(withSnapshot, portfolio.length),
    },
    alerts,
  };

  return {
    filters: {
      area: input.area ?? "",
      phase: input.phase ?? "",
      priority: input.priority ?? "",
      period: selectedPeriod,
    },
    portfolio,
    committee,
  };
}
