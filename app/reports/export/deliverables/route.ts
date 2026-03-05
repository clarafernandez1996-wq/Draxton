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
  const deliverables = await prisma.deliverable.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      description: true,
      sharepointLink: true,
      committedDate: true,
      expectedDate: true,
      raciA: true,
      raciB: true,
      raciC: true,
      raciD: true,
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
    "entregable",
    "estado",
    "descripcion",
    "enlace",
    "fecha_comprometida",
    "fecha_esperada",
    "raci_a",
    "raci_b",
    "raci_c",
    "raci_d",
    "proyecto_id",
    "proyecto_nombre",
    "planta",
    "creado_en",
  ];

  const lines = deliverables.map((d) =>
    [
      d.id,
      d.title,
      d.status,
      d.description ?? "",
      d.sharepointLink ?? "",
      d.committedDate ? d.committedDate.toISOString() : "",
      d.expectedDate ? d.expectedDate.toISOString() : "",
      d.raciA,
      d.raciB,
      d.raciC,
      d.raciD,
      d.project.id,
      d.project.name,
      d.project.plant,
      d.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="entregables.csv"',
    },
  });
}
