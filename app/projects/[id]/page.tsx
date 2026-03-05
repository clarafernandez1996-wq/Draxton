import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { FinancePanel } from "./FinancePanel";
import { DeliverablesPanel } from "./DeliverablesPanel";
import { RiskPanel } from "./RiskPanel";
import { TaskPanel } from "./TaskPanel";

const TABS = [
  { id: "summary", label: "Resumen" },
  { id: "charter", label: "Acta" },
  { id: "plan", label: "Plan y tareas" },
  { id: "deliverables", label: "Entregables" },
  { id: "risks", label: "Riesgos" },
  { id: "finance", label: "Control económico" },
  { id: "monthly", label: "Seguimiento mensual" },
  { id: "changes", label: "Cambios" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  ON_HOLD: "En pausa",
  BLOCKED: "Bloqueado",
  DONE: "Completado",
  CANCELED: "Cancelado",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  ESTRATEGICO: "Estratégico",
  TACTICO: "Táctico",
  OPERATIVO: "Operativo",
};

const AREA_LABELS: Record<string, string> = {
  IT: "IT",
  RRHH: "RRHH",
  INGENIERIA: "Ingeniería",
};

function parseTab(input: string | undefined): TabId {
  return (TABS.find((t) => t.id === input)?.id ?? "summary") as TabId;
}

function statusCardClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-green-300 bg-green-50 text-green-800";
    case "ON_HOLD":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "BLOCKED":
      return "border-red-300 bg-red-50 text-red-800";
    case "DONE":
      return "border-slate-300 bg-slate-50 text-slate-700";
    case "CANCELED":
      return "border-neutral-300 bg-neutral-100 text-neutral-700";
    default:
      return "border-gray-300 bg-gray-50 text-gray-700";
  }
}

function priorityCardClass(priority: string) {
  switch (priority) {
    case "CRITICAL":
      return "border-[#C8102E] bg-[#FDECEF] text-[#8B0A1F]";
    case "HIGH":
      return "border-orange-300 bg-orange-50 text-orange-800";
    case "MEDIUM":
      return "border-[#0B3A6E] bg-[#EAF2FB] text-[#0B3A6E]";
    case "LOW":
      return "border-slate-300 bg-slate-50 text-slate-700";
    default:
      return "border-gray-300 bg-gray-50 text-gray-700";
  }
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(date);
}

function formatDateShort(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const selectedTab = parseTab(query.tab);
  const authUser = await getAuthUser();

  let project: any = null;
  try {
    project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { createdAt: "desc" } },
        risks: { orderBy: { createdAt: "desc" } },
        deliverables: { orderBy: { createdAt: "desc" } },
        deliverableItems: { orderBy: { createdAt: "desc" } },
        monthlySnapshots: { orderBy: { period: "desc" }, take: 12 },
        financeEntries: { orderBy: { createdAt: "desc" } },
        financeSummary: true,
      },
    });
  } catch (error) {
    // Fallback while finance migration is pending (missing table in local DB)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      const baseProject = await prisma.project.findUnique({
        where: { id },
        include: {
          tasks: { orderBy: { createdAt: "desc" } },
          risks: { orderBy: { createdAt: "desc" } },
          deliverables: { orderBy: { createdAt: "desc" } },
          deliverableItems: { orderBy: { createdAt: "desc" } },
          monthlySnapshots: { orderBy: { period: "desc" }, take: 12 },
        },
      });
      project = baseProject
        ? {
            ...baseProject,
            financeEntries: [],
            financeSummary: null,
            deliverableItems: [],
          }
        : null;
    } else {
      throw error;
    }
  }

  if (!project) notFound();

  const doneTasks = project.tasks.filter((t: { status: string }) => t.status === "DONE").length;
const openRisks = project.risks.filter((r: { status: string }) => r.status === "OPEN").length;
const delivered = project.deliverables.filter((d: { status: string }) => d.status === "DELIVERED").length;

type ProjectTask = (typeof project.tasks)[number];

  const tasks = project.tasks.map((task: ProjectTask) => ({

    id: task.id,
    title: task.title,
    ownerName: task.ownerName,
    priority: task.priority,
    status: task.status,
    plannedStart: task.plannedStart?.toISOString() ?? task.startPlanned?.toISOString() ?? null,
    plannedEnd: task.plannedEnd?.toISOString() ?? task.endPlanned?.toISOString() ?? task.dueDate?.toISOString() ?? null,
    actualStart: task.actualStart?.toISOString() ?? task.startReal?.toISOString() ?? null,
    actualEnd: task.actualEnd?.toISOString() ?? task.endReal?.toISOString() ?? null,
    progressActual: task.progressActual ?? task.progressReal ?? Math.round(task.progress ?? 0),
    comments: task.comments,
    createdAt: task.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B3A6E]">{project.name}</h1>
          <p className="text-sm text-[#6E6E6E]">Ficha de proyecto</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/projects"
            className="rounded-lg border border-[#0B3A6E] px-4 py-2 text-sm font-medium text-[#0B3A6E] hover:bg-[#EAF2FB] transition"
          >
            Volver a proyectos
          </Link>
          <Link
            href={`/projects/${project.id}/edit`}
            className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Editar proyecto
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white p-2 shadow">
        <div className="flex min-w-max items-center gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/projects/${project.id}?tab=${tab.id}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                selectedTab === tab.id ? "bg-[#0B3A6E] text-white" : "text-[#0B3A6E] hover:bg-[#EAF2FB]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {selectedTab === "summary" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Estado</div>
              <div className={`mt-2 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold ${statusCardClass(project.status)}`}>
                {STATUS_LABELS[project.status] ?? project.status}
              </div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Prioridad</div>
              <div className={`mt-2 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold ${priorityCardClass(project.priority)}`}>
                {PRIORITY_LABELS[project.priority] ?? project.priority}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow">
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Tareas</div>
              <div className="mt-1 text-2xl font-bold text-[#0B3A6E]">
                {doneTasks}/{project.tasks.length}
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Riesgos abiertos</div>
              <div className="mt-1 text-2xl font-bold text-[#C8102E]">{openRisks}</div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow">
              <div className="text-xs uppercase tracking-wide text-[#6E6E6E]">Entregables entregados</div>
              <div className="mt-1 text-2xl font-bold text-[#0B3A6E]">
                {delivered}/{project.deliverables.length}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTab === "charter" ? (
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Acta</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Nombre del proyecto</div>
              <div className="mt-1 text-sm">{project.name || "-"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">ID del proyecto</div>
              <div className="mt-1 text-sm">{project.projectCode || project.code || "-"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Tipo</div>
              <div className="mt-1 text-sm">{PROJECT_TYPE_LABELS[project.projectType] ?? project.projectType}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Área</div>
              <div className="mt-1 text-sm">{AREA_LABELS[project.area] ?? project.area}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Responsable</div>
              <div className="mt-1 text-sm">{project.ownerName ?? "-"}</div>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Descripción</div>
            <p className="mt-2 text-sm leading-6 text-[#1A1A1A]">{project.description?.trim() || "Sin descripción."}</p>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Caso de negocio</div>
            <p className="mt-2 text-sm leading-6 text-[#1A1A1A]">{project.scope?.trim() || "-"}</p>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Objetivos principales</div>
            <p className="mt-2 text-sm leading-6 text-[#1A1A1A]">{project.objective?.trim() || "-"}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 border-t pt-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fecha de inicio</div>
              <div className="mt-1 text-sm">{formatDate(project.startDate)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fecha de fin</div>
              <div className="mt-1 text-sm">{formatDate(project.endDate)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTab === "plan" ? (
        <TaskPanel projectId={project.id} tasks={tasks} canDelete={authUser?.role === "ADMIN"} />
      ) : null}

      {selectedTab === "deliverables" ? (
        <DeliverablesPanel
          projectId={project.id}
          tasks={project.tasks.map((task) => ({
            id: task.id,
            title: task.title,
          }))}
          deliverables={project.deliverableItems.map((item) => {
            const linkedTask = project.tasks.find((task) => task.id === item.taskId);
            return {
              id: item.id,
              name: item.name,
              taskId: item.taskId,
              taskTitle: linkedTask?.title ?? null,
              status: item.status,
              committedDate: item.committedDate ? item.committedDate.toISOString() : null,
              ownerName: item.ownerName,
              sharepointLink: item.sharepointLink,
            };
          })}
        />
      ) : null}

      {selectedTab === "risks" ? (
        <RiskPanel
          projectId={project.id}
          risks={project.risks.map((risk) => ({
            id: risk.id,
            title: risk.title,
            status: risk.status,
            probability: risk.probability,
            impact: risk.impact,
            targetDate: risk.targetDate ? risk.targetDate.toISOString() : null,
            ownerName: risk.ownerName,
          }))}
        />
      ) : null}

      {selectedTab === "finance" ? (
        <FinancePanel
          projectId={project.id}
          summary={{
            budgetApproved: project.financeSummary?.budgetApproved ?? 0,
            actualCost: project.financeSummary?.actualCost ?? 0,
            committedCost: project.financeSummary?.committedCost ?? 0,
            economicRiskNote: project.financeSummary?.economicRiskNote ?? null,
          }}
          entries={project.financeEntries.map((entry) => ({
            id: entry.id,
            type: (entry.type === "INCOME" || entry.type === "BENEFIT" ? entry.type : "COST"),
            category: entry.category,
            description: entry.description,
            supplier: entry.supplier,
            ownerName: entry.ownerName,
            leverage: entry.leverage,
            budgetAmount: entry.budgetAmount,
            actualAmount: entry.actualAmount,
            probability: entry.probability,
            weightedAmount: entry.weightedAmount,
            capex: entry.capex,
            opexAnnual: entry.opexAnnual,
            paybackYears: entry.paybackYears,
            roiPercent: entry.roiPercent,
          }))}
        />
      ) : null}

      {selectedTab === "monthly" ? (
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Seguimiento mensual</h2>
          {project.monthlySnapshots.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed p-4 text-sm text-[#6E6E6E]">No hay snapshots mensuales registrados.</div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Periodo</th>
                    <th className="px-3 py-2 font-semibold">Planificación</th>
                    <th className="px-3 py-2 font-semibold">Coste</th>
                    <th className="px-3 py-2 font-semibold">Alcance</th>
                    <th className="px-3 py-2 font-semibold">Riesgo</th>
                    <th className="px-3 py-2 font-semibold">Proveedor</th>
                    <th className="px-3 py-2 font-semibold">Actualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {project.monthlySnapshots.map((snap) => (
                    <tr key={snap.id}>
                      <td className="px-3 py-2">{snap.period}</td>
                      <td className="px-3 py-2">{snap.scheduleRag}</td>
                      <td className="px-3 py-2">{snap.costRag}</td>
                      <td className="px-3 py-2">{snap.scopeRag}</td>
                      <td className="px-3 py-2">{snap.riskRag}</td>
                      <td className="px-3 py-2">{snap.supplierRag}</td>
                      <td className="px-3 py-2">{formatDateShort(snap.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {selectedTab === "changes" ? (
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Cambios</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold">Versión</th>
                  <th className="px-3 py-2 font-semibold">Fecha</th>
                  <th className="px-3 py-2 font-semibold">Autor</th>
                  <th className="px-3 py-2 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2">1.0</td>
                  <td className="px-3 py-2">{formatDate(project.createdAt)}</td>
                  <td className="px-3 py-2">{project.ownerName ?? "Sistema"}</td>
                  <td className="px-3 py-2">Alta del proyecto</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">1.1</td>
                  <td className="px-3 py-2">{formatDate(project.updatedAt)}</td>
                  <td className="px-3 py-2">{project.ownerName ?? "Sistema"}</td>
                  <td className="px-3 py-2">Última actualización de la ficha</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
