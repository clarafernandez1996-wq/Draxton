import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { updateProjectAction } from "../../actions";

const TABS = [
  { id: "summary", label: "Resumen" },
  { id: "charter", label: "Acta" },
  { id: "plan", label: "Plan y tareas" },
  { id: "risks", label: "Riesgos" },
  { id: "finance", label: "Control economico" },
  { id: "monthly", label: "Seguimiento mensual" },
  { id: "changes", label: "Cambios" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseTab(input: string | undefined): TabId {
  return (TABS.find((t) => t.id === input)?.id ?? "summary") as TabId;
}

function toInputDate(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function errorText(code: string) {
  if (code === "required") return "Nombre del proyecto e ID del proyecto son obligatorios.";
  if (code === "project_code_taken") return "El ID del proyecto ya existe. Usa otro valor.";
  if (code === "not_found") return "El proyecto no existe o fue eliminado.";
  if (code === "update_failed") return "No se pudo actualizar el proyecto.";
  return "";
}

function toTypeValue(value: string) {
  if (value === "ESTRATEGICO") return "STRATEGIC";
  if (value === "TACTICO") return "TACTICAL";
  return "OPERATIONAL";
}

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const selectedTab = parseTab(readParam(query.tab));

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  const error = errorText(readParam(query.error));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0B3A6E]">Editar proyecto</h1>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-x-auto rounded-xl bg-white p-2 shadow">
        <div className="flex min-w-max items-center gap-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/projects/${project.id}/edit?tab=${tab.id}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                selectedTab === tab.id ? "bg-[#0B3A6E] text-white" : "text-[#0B3A6E] hover:bg-[#EAF2FB]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <form action={updateProjectAction} className="max-w-4xl space-y-5 rounded-xl bg-white p-5 shadow">
        <input type="hidden" name="id" value={project.id} />

        <section className={selectedTab === "summary" ? "space-y-4" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Resumen</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <div className="text-sm font-medium">Fase</div>
              <select name="phase" defaultValue={project.phase} className="w-full rounded-lg border px-3 py-2">
                <option value="DEFINICION">Definicion</option>
                <option value="EJECUCION">Ejecucion</option>
                <option value="IMPLANTACION">Implantacion</option>
                <option value="ESTABILIZACION">Estabilizacion</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Estado</div>
              <select name="status" defaultValue={project.status} className="w-full rounded-lg border px-3 py-2">
                <option value="ACTIVE">Activo</option>
                <option value="ON_HOLD">En pausa</option>
                <option value="BLOCKED">Bloqueado</option>
                <option value="DONE">Completado</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Prioridad</div>
              <select name="priority" defaultValue={project.priority} className="w-full rounded-lg border px-3 py-2">
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Critica</option>
              </select>
            </label>
          </div>
        </section>

        <section className={selectedTab === "charter" ? "space-y-4" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Acta</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm font-medium">Nombre del proyecto *</div>
              <input name="name" defaultValue={project.name} className="w-full rounded-lg border px-3 py-2" required />
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">ID del proyecto *</div>
              <input
                name="projectCode"
                defaultValue={project.projectCode ?? project.code ?? ""}
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1">
              <div className="text-sm font-medium">Tipo</div>
              <select name="projectType" defaultValue={toTypeValue(project.projectType)} className="w-full rounded-lg border px-3 py-2">
                <option value="STRATEGIC">Strategic</option>
                <option value="TACTICAL">Tactical</option>
                <option value="OPERATIONAL">Operational</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Area</div>
              <select name="area" defaultValue={project.area} className="w-full rounded-lg border px-3 py-2">
                <option value="IT">IT</option>
                <option value="RRHH">RRHH</option>
                <option value="INGENIERIA">Ingenieria</option>
              </select>
            </label>

            <label className="space-y-1">
              <div className="text-sm font-medium">Responsable</div>
              <input name="ownerName" defaultValue={project.ownerName ?? ""} className="w-full rounded-lg border px-3 py-2" />
            </label>
          </div>

          <label className="space-y-1">
            <div className="text-sm font-medium">Descripcion del proyecto</div>
            <textarea name="description" defaultValue={project.description ?? ""} className="w-full rounded-lg border px-3 py-2" rows={3} />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Caso de negocio</div>
            <textarea name="businessCase" defaultValue={project.scope ?? ""} className="w-full rounded-lg border px-3 py-2" rows={3} />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Objetivos principales</div>
            <textarea name="mainObjectives" defaultValue={project.objective ?? ""} className="w-full rounded-lg border px-3 py-2" rows={3} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm font-medium">Fecha de inicio</div>
              <input name="startDate" type="date" defaultValue={toInputDate(project.startDate)} className="w-full rounded-lg border px-3 py-2" />
            </label>
            <label className="space-y-1">
              <div className="text-sm font-medium">Fecha de fin</div>
              <input name="endDate" type="date" defaultValue={toInputDate(project.endDate)} className="w-full rounded-lg border px-3 py-2" />
            </label>
          </div>
        </section>

        <section className={selectedTab === "plan" ? "space-y-2" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Plan y tareas</h2>
          <p className="text-sm text-[#6E6E6E]">Las tareas se editan en la ficha del proyecto, pestaña Plan y tareas.</p>
        </section>

        <section className={selectedTab === "risks" ? "space-y-2" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Riesgos</h2>
          <p className="text-sm text-[#6E6E6E]">Los riesgos se editan en la ficha del proyecto, pestaña Riesgos.</p>
        </section>

        <section className={selectedTab === "finance" ? "space-y-2" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Control economico</h2>
          <p className="text-sm text-[#6E6E6E]">El control economico se gestiona desde la pestaña de detalle correspondiente.</p>
        </section>

        <section className={selectedTab === "monthly" ? "space-y-2" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Seguimiento mensual</h2>
          <p className="text-sm text-[#6E6E6E]">Los snapshots mensuales se gestionan en la pestaña Seguimiento mensual.</p>
        </section>

        <section className={selectedTab === "changes" ? "space-y-2" : "hidden"}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]">Cambios</h2>
          <p className="text-sm text-[#6E6E6E]">El registro de cambios se muestra en la ficha del proyecto.</p>
        </section>

        <div className="flex gap-3 border-t pt-5">
          <button className="rounded-lg bg-[#C8102E] px-5 py-2 text-white transition hover:opacity-90">Guardar cambios</button>
          <Link href={`/projects/${project.id}`} className="rounded-lg border px-5 py-2">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
