import Link from "next/link";
import { prisma } from "../lib/prisma";

const STATUS_VALUES = ["ACTIVE", "ON_HOLD", "BLOCKED", "DONE", "CANCELED"] as const;
const PHASE_VALUES = ["DEFINICION", "EJECUCION", "IMPLANTACION", "ESTABILIZACION"] as const;
const TYPE_VALUES = ["ESTRATEGICO", "TACTICO", "OPERATIVO"] as const;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  ON_HOLD: "En pausa",
  BLOCKED: "Bloqueado",
  DONE: "Completado",
  CANCELED: "Cancelado",
};

const PHASE_LABELS: Record<string, string> = {
  DEFINICION: "Definici\u00f3n",
  EJECUCION: "Ejecuci\u00f3n",
  IMPLANTACION: "Implantaci\u00f3n",
  ESTABILIZACION: "Estabilizaci\u00f3n",
};

const TYPE_LABELS: Record<string, string> = {
  ESTRATEGICO: "Estrat\u00e9gico",
  TACTICO: "T\u00e1ctico",
  OPERATIVO: "Operativo",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Cr\u00edtica",
};

function readFilter(value: string | string[] | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}

function isAllowed<T extends readonly string[]>(value: string, values: T): value is T[number] {
  return values.includes(value);
}

function successText(code: string) {
  if (code === "created") return "Proyecto creado correctamente.";
  if (code === "deleted") return "Proyecto eliminado correctamente.";
  return "";
}

function errorText(code: string) {
  if (code === "forbidden") return "No tienes permisos para eliminar proyectos.";
  if (code === "missing_id") return "No se ha indicado el proyecto.";
  if (code === "not_found") return "El proyecto no existe o ya fue eliminado.";
  if (code === "delete_failed") return "No se pudo eliminar el proyecto.";
  return "";
}

function statusBadge(status: string) {
  const base = "inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full font-medium";
  switch (status) {
    case "ACTIVE":
      return `${base} bg-green-100 text-green-700`;
    case "ON_HOLD":
      return `${base} bg-yellow-100 text-yellow-700`;
    case "BLOCKED":
      return `${base} bg-red-100 text-red-700`;
    case "DONE":
      return `${base} bg-gray-200 text-gray-700`;
    case "CANCELED":
      return `${base} bg-gray-300 text-gray-800`;
    default:
      return `${base} bg-gray-100 text-gray-600`;
  }
}

function statusDot(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-500";
    case "ON_HOLD":
      return "bg-yellow-500";
    case "BLOCKED":
      return "bg-red-500";
    case "DONE":
    case "CANCELED":
      return "bg-gray-500";
    default:
      return "bg-gray-400";
  }
}

function priorityBadge(priority: string) {
  const base = "px-2 py-1 text-xs rounded-full font-medium";
  switch (priority) {
    case "CRITICAL":
      return `${base} bg-red-600 text-white`;
    case "HIGH":
      return `${base} bg-orange-500 text-white`;
    case "MEDIUM":
      return `${base} bg-blue-500 text-white`;
    case "LOW":
      return `${base} bg-gray-400 text-white`;
    default:
      return `${base} bg-gray-200 text-gray-700`;
  }
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const plant = readFilter(params.plant).trim();
  const statusRaw = readFilter(params.status).trim();
  const phaseRaw = readFilter(params.phase).trim();
  const typeRaw = readFilter(params.type).trim();
  const successCode = readFilter(params.success).trim();
  const errorCode = readFilter(params.error).trim();
  const successMessage = successText(successCode);
  const errorMessage = errorText(errorCode);

  const status = isAllowed(statusRaw, STATUS_VALUES) ? statusRaw : "";
  const phase = isAllowed(phaseRaw, PHASE_VALUES) ? phaseRaw : "";
  const projectType = isAllowed(typeRaw, TYPE_VALUES) ? typeRaw : "";

  const where = {
    ...(plant ? { plant } : {}),
    ...(status ? { status } : {}),
    ...(phase ? { phase } : {}),
    ...(projectType ? { projectType } : {}),
  };

  const [projects, plants] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      select: { plant: true },
      distinct: ["plant"],
      orderBy: { plant: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0B3A6E]">Proyectos</h1>
        <Link
          href="/projects/new"
          className="bg-[#C8102E] text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      ) : null}

      <form method="get" action="/projects" className="bg-white rounded-xl shadow p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Planta</span>
            <select name="plant" defaultValue={plant} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todas</option>
              {plants.map((p) => (
                <option key={p.plant} value={p.plant}>
                  {p.plant}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Estado</span>
            <select name="status" defaultValue={status} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="ON_HOLD">En pausa</option>
              <option value="BLOCKED">Bloqueado</option>
              <option value="DONE">Completado</option>
              <option value="CANCELED">Cancelado</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Fase</span>
            <select name="phase" defaultValue={phase} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todas</option>
              <option value="DEFINICION">{"Definici\u00f3n"}</option>
              <option value="EJECUCION">{"Ejecuci\u00f3n"}</option>
              <option value="IMPLANTACION">{"Implantaci\u00f3n"}</option>
              <option value="ESTABILIZACION">{"Estabilizaci\u00f3n"}</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#6E6E6E]">Tipo</span>
            <select name="type" defaultValue={projectType} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="ESTRATEGICO">{"Estrat\u00e9gico"}</option>
              <option value="TACTICO">{"T\u00e1ctico"}</option>
              <option value="OPERATIVO">Operativo</option>
            </select>
          </label>

          <div className="flex items-end gap-2">
            <button type="submit" className="rounded-lg bg-[#0B3A6E] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition">
              Filtrar
            </button>
            <Link href="/projects" className="rounded-lg border border-[#0B3A6E] px-4 py-2 text-sm font-medium text-[#0B3A6E] hover:bg-[#EAF2FB] transition">
              Limpiar
            </Link>
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-6 text-sm text-[#6E6E6E]">{"No hay proyectos todav\u00eda. Vamos a crear el primero."}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Planta</th>
                <th className="px-4 py-3 font-semibold">Fase</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Prioridad</th>
                <th className="px-4 py-3 font-semibold">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => {
                const rowHref = `/projects/${p.id}`;
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3 text-[#0B3A6E] hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3">
                        {p.plant}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3">
                        {PHASE_LABELS[p.phase] ?? p.phase}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3">
                        {TYPE_LABELS[p.projectType] ?? p.projectType}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3">
                        <span className={statusBadge(p.status)}>
                          <span className={`h-2 w-2 rounded-full ${statusDot(p.status)}`} />
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3">
                        <span className={priorityBadge(p.priority)}>{PRIORITY_LABELS[p.priority] ?? p.priority}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={rowHref} className="block -mx-4 -my-3 px-4 py-3">
                        {p.ownerName ?? "-"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
