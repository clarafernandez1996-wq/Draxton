import Link from "next/link";
import { prisma } from "../lib/prisma";

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <div className={`h-1 w-14 rounded ${color}`} />
      <p className="mt-3 text-sm text-[#6E6E6E]">{title}</p>
      <p className="mt-1 text-3xl font-bold text-[#0B3A6E]">{value}</p>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  ON_HOLD: "En pausa",
  BLOCKED: "Bloqueado",
  DONE: "Completado",
  CANCELED: "Cancelado",
};

const PHASE_LABELS: Record<string, string> = {
  DEFINICION: "Definición",
  EJECUCION: "Ejecución",
  IMPLANTACION: "Implantación",
  ESTABILIZACION: "Estabilización",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const TYPE_LABELS: Record<string, string> = {
  ESTRATEGICO: "Estratégico",
  TACTICO: "Táctico",
  OPERATIVO: "Operativo",
};

export default async function ReportsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeProjects,
    blockedProjects,
    overdueTasks,
    openRisks,
    highOpenRisks,
    overdueOpenRisks,
    overdueDeliverables,
    groupedByStatus,
    groupedByPhase,
    groupedByPriority,
    groupedByType,
  ] = await prisma.$transaction([
    prisma.project.count({
      where: { status: "ACTIVE" },
    }),
    prisma.project.count({
      where: { status: "BLOCKED" },
    }),
    prisma.task.count({
      where: {
        dueDate: { lt: today },
        status: { not: "DONE" },
      },
    }),
    prisma.risk.count({
      where: { status: "OPEN" },
    }),
    prisma.risk.count({
      where: {
        status: "OPEN",
        probability: { gte: 3 },
        impact: { gte: 4 },
      },
    }),
    prisma.risk.count({
      where: {
        status: "OPEN",
        targetDate: { lt: today },
      },
    }),
    prisma.deliverable.count({
      where: {
        status: { not: "DELIVERED" },
        committedDate: { lt: today },
      },
    }),
    prisma.project.groupBy({
      by: ["status"],
      orderBy: { status: "asc" },
      _count: { status: true },
    }),
    prisma.project.groupBy({
      by: ["phase"],
      orderBy: { phase: "asc" },
      _count: { phase: true },
    }),
    prisma.project.groupBy({
      by: ["priority"],
      orderBy: { priority: "asc" },
      _count: { priority: true },
    }),
    prisma.project.groupBy({
      by: ["projectType"],
      orderBy: { projectType: "asc" },
      _count: { projectType: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0B3A6E]">Reportes</h1>
          <p className="text-sm text-[#6E6E6E]">Vista ejecutiva global y exportación de datos.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/reports/export/projects"
            className="rounded-lg border border-[#0B3A6E] px-4 py-2 text-sm font-medium text-[#0B3A6E] hover:bg-[#EAF2FB] transition"
          >
            Exportar proyectos
          </Link>
          <Link
            href="/reports/export/tasks"
            className="rounded-lg border border-[#0B3A6E] px-4 py-2 text-sm font-medium text-[#0B3A6E] hover:bg-[#EAF2FB] transition"
          >
            Exportar tareas
          </Link>
          <Link
            href="/reports/export/risks"
            className="rounded-lg border border-[#0B3A6E] px-4 py-2 text-sm font-medium text-[#0B3A6E] hover:bg-[#EAF2FB] transition"
          >
            Exportar riesgos
          </Link>
          <Link
            href="/reports/export/deliverables"
            className="rounded-lg bg-[#0B3A6E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Exportar entregables
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Proyectos activos" value={activeProjects} color="bg-green-500" />
        <Card title="Proyectos bloqueados" value={blockedProjects} color="bg-red-500" />
        <Card title="Tareas vencidas" value={overdueTasks} color="bg-amber-500" />
        <Card title="Riesgos abiertos" value={openRisks} color="bg-[#6E6E6E]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Riesgos altos abiertos</div>
          <div className="mt-2 text-2xl font-bold text-[#C8102E]">{highOpenRisks}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Riesgos abiertos vencidos</div>
          <div className="mt-2 text-2xl font-bold text-[#C8102E]">{overdueOpenRisks}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Entregables comprometidos vencidos</div>
          <div className="mt-2 text-2xl font-bold text-[#C8102E]">{overdueDeliverables}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Proyectos por estado</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Estado</th>
                  <th className="px-4 py-2 text-left font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupedByStatus.map((row) => (
                  <tr key={row.status}>
                    <td className="px-4 py-2">{STATUS_LABELS[row.status] ?? row.status}</td>
                    <td className="px-4 py-2">{row._count?.status ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Proyectos por fase</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Fase</th>
                  <th className="px-4 py-2 text-left font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupedByPhase.map((row) => (
                  <tr key={row.phase}>
                    <td className="px-4 py-2">{PHASE_LABELS[row.phase] ?? row.phase}</td>
                    <td className="px-4 py-2">{row._count?.phase ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Proyectos por prioridad</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Prioridad</th>
                  <th className="px-4 py-2 text-left font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupedByPriority.map((row) => (
                  <tr key={row.priority}>
                    <td className="px-4 py-2">{PRIORITY_LABELS[row.priority] ?? row.priority}</td>
                    <td className="px-4 py-2">{row._count?.priority ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-[#0B3A6E]">Proyectos por tipo</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-2 text-left font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupedByType.map((row) => (
                  <tr key={row.projectType}>
                    <td className="px-4 py-2">{TYPE_LABELS[row.projectType] ?? row.projectType}</td>
                    <td className="px-4 py-2">{row._count?.projectType ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



