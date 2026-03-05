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
  const risks = await prisma.risk.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      ownerName: true,
      mitigationPlan: true,
      targetDate: true,
      status: true,
      probability: true,
      impact: true,
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
    "riesgo",
    "descripcion",
    "responsable",
    "mitigacion",
    "fecha_objetivo",
    "estado",
    "probabilidad",
    "impacto",
    "proyecto_id",
    "proyecto_nombre",
    "planta",
    "creado_en",
  ];

  const lines = risks.map((r) =>
    [
      r.id,
      r.title,
      r.description ?? "",
      r.ownerName ?? "",
      r.mitigationPlan ?? "",
      r.targetDate ? r.targetDate.toISOString() : "",
      r.status,
      r.probability,
      r.impact,
      r.project.id,
      r.project.name,
      r.project.plant,
      r.createdAt.toISOString(),
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [header.join(","), ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="riesgos.csv"',
    },
  });
}
