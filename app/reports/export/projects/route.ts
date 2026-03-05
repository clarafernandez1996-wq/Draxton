import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  return text;
}

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      plant: true,
      projectType: true,
      phase: true,
      status: true,
      priority: true,
      ownerName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const header = [
    "id",
    "nombre",
    "planta",
    "tipo",
    "fase",
    "estado",
    "prioridad",
    "responsable",
    "creado_en",
    "actualizado_en",
  ];

  const lines = projects.map((p) =>
    [
      p.id,
      p.name,
      p.plant,
      p.projectType,
      p.phase,
      p.status,
      p.priority,
      p.ownerName ?? "",
      p.createdAt.toISOString(),
      p.updatedAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename=\"proyectos.csv\"',
    },
  });
}
