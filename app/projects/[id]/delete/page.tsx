import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import { deleteProjectAction } from "../../actions";

export default async function DeleteProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    redirect("/projects");
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, plant: true },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#0B3A6E]">Eliminar proyecto</h1>

      <div className="rounded-xl border border-red-200 bg-white p-5 shadow space-y-4">
        <p className="text-sm text-[#1A1A1A]">
          Vas a eliminar el proyecto <strong>{project.name}</strong> ({project.plant}).
        </p>
        <p className="text-sm text-red-700">
          Esta acción no se puede deshacer y eliminará también sus tareas y riesgos.
        </p>

        <div className="flex gap-3">
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project.id} />
            <button
              type="submit"
              className="rounded-lg bg-[#C8102E] px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition"
            >
              Sí, eliminar proyecto
            </button>
          </form>

          <Link href={`/projects/${project.id}`} className="rounded-lg border px-5 py-2 text-sm">
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}
