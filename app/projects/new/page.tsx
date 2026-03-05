import Link from "next/link";
import { createProjectAction } from "../actions";

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function errorText(code: string) {
  if (code === "required") return "Nombre del proyecto e ID del proyecto son obligatorios.";
  if (code === "project_code_taken") return "El ID del proyecto ya existe. Usa otro valor.";
  if (code === "create_failed") return "No se pudo crear el proyecto.";
  return "";
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = errorText(readParam(params.error));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0B3A6E]">Nuevo proyecto</h1>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <form action={createProjectAction} className="max-w-4xl space-y-5 rounded-xl bg-white p-5 shadow">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Nombre del proyecto *</div>
            <input name="name" className="w-full rounded-lg border px-3 py-2" placeholder="Ej: Migraci�n ERP" required />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">ID del proyecto *</div>
            <input
              name="projectCode"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ej: PRJ-2026-001"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">Tipo</div>
            <select name="projectType" className="w-full rounded-lg border px-3 py-2">
              <option value="STRATEGIC">Estrat�gico</option>
              <option value="TACTICAL">T�ctico</option>
              <option value="OPERATIONAL">Operativo</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">�rea</div>
            <select name="area" className="w-full rounded-lg border px-3 py-2">
              <option value="IT">IT</option>
              <option value="RRHH">RRHH</option>
              <option value="INGENIERIA">Ingenier�a</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Responsable</div>
            <input name="ownerName" className="w-full rounded-lg border px-3 py-2" placeholder="Nombre Apellido" />
          </label>
        </div>

        <label className="space-y-1">
          <div className="text-sm font-medium">Descripci�n del proyecto</div>
          <textarea name="description" className="w-full rounded-lg border px-3 py-2" rows={3} />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Caso de negocio</div>
          <textarea name="businessCase" className="w-full rounded-lg border px-3 py-2" rows={3} />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Objetivos principales</div>
          <textarea name="mainObjectives" className="w-full rounded-lg border px-3 py-2" rows={3} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Fecha de inicio</div>
            <input name="startDate" type="date" className="w-full rounded-lg border px-3 py-2" />
          </label>
          <label className="space-y-1">
            <div className="text-sm font-medium">Fecha de fin</div>
            <input name="endDate" type="date" className="w-full rounded-lg border px-3 py-2" />
          </label>
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg bg-[#C8102E] px-5 py-2 text-white transition hover:opacity-90">Crear proyecto</button>
          <Link href="/projects" className="rounded-lg border px-5 py-2">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
