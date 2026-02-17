import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";

async function createProject(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const plant = String(formData.get("plant") ?? "").trim();

  if (!name || !plant) {
    // MVP: en vez de gestionar errores complejos, redirigimos
    redirect("/projects?error=missing");
  }

  const phase = String(formData.get("phase") ?? "IDEA");
  const status = String(formData.get("status") ?? "ACTIVE");
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  await prisma.project.create({
  data: {
    name,
    plant,
  },
});

  redirect("/projects");
}

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0B3A6E]">Nuevo proyecto</h1>

      <form action={createProject} className="bg-white rounded-xl shadow p-5 space-y-4 max-w-2xl">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <div className="text-sm font-medium">Nombre *</div>
            <input name="name" className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Nuevo utillaje línea X" />
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Planta *</div>
            <input name="plant" className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Toledo / Valladolid / ..." />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1">
            <div className="text-sm font-medium">Fase</div>
            <select name="phase" className="w-full border rounded-lg px-3 py-2">
              <option value="IDEA">Idea</option>
              <option value="DESIGN">Design</option>
              <option value="INDUSTRIALIZATION">Industrialization</option>
              <option value="VALIDATION">Validation</option>
              <option value="SOP">SOP</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Estado</div>
            <select name="status" className="w-full border rounded-lg px-3 py-2">
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="BLOCKED">Blocked</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </label>

          <label className="space-y-1">
            <div className="text-sm font-medium">Prioridad</div>
            <select name="priority" className="w-full border rounded-lg px-3 py-2">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
        </div>

        <label className="space-y-1">
          <div className="text-sm font-medium">Responsable (owner)</div>
          <input name="ownerName" className="w-full border rounded-lg px-3 py-2" placeholder="Ej: Nombre Apellido" />
        </label>

        <label className="space-y-1">
          <div className="text-sm font-medium">Descripción</div>
          <textarea name="description" className="w-full border rounded-lg px-3 py-2" rows={4} placeholder="Contexto, objetivo, notas..." />
        </label>

        <div className="flex gap-3">
          <button className="bg-[#C8102E] text-white px-5 py-2 rounded-lg hover:opacity-90 transition">
            Crear proyecto
          </button>
          <a href="/projects" className="px-5 py-2 rounded-lg border">
            Cancelar
          </a>
        </div>
      </form>
    </div>
  );
}
