import { prisma } from "../lib/prisma";
import Link from "next/link";

function statusBadge(status: string) {
  const base = "px-2 py-1 text-xs rounded-full font-medium";
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

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0B3A6E]">Proyectos</h1>

        <Link
          href="/projects/new"
          className="bg-[#C8102E] text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm"
        >
          + Nuevo proyecto
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-6 text-sm text-[#6E6E6E]">
            No hay proyectos todavía. Vamos a crear el primero.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Planta</th>
                <th className="px-4 py-3 font-semibold">Fase</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Prioridad</th>
                <th className="px-4 py-3 font-semibold">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.plant}</td>
                  <td className="px-4 py-3">{p.phase}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(p.status)}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={priorityBadge(p.priority)}>
                      {p.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.ownerName ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
