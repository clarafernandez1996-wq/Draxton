import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, "\"\"")}"`;
  }
  return text;
}

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          name: true,
          plant: true,
        },
      },
    },
  });

  const header = [
    "id",
    "titulo",
    "estado",
    "prioridad",
    "fecha_limite",
    "proyecto_id",
    "proyecto_nombre",
    "planta",
    "creado_en",
  ];

  const lines = tasks.map((t) =>
    [
      t.id,
      t.title,
      t.status,
      t.priority,
      t.dueDate ? t.dueDate.toISOString() : "",
      t.project.id,
      t.project.name,
      t.project.plant,
      t.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename=\"tareas.csv\"',
    },
  });
}
