import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const projectCount = await prisma.project.count();
  if (projectCount > 0) {
    console.log("Seed skipped: projects already exist.");
    return;
  }

  const project = await prisma.project.create({
    data: {
      name: "Lanzamiento linea de fundicion",
      plant: "Valladolid",
      projectType: "ESTRATEGICO",
      phase: "DEFINICION",
      status: "ACTIVE",
      priority: "HIGH",
      ownerName: "Equipo Ingenieria",
      description: "Proyecto semilla para validar entorno.",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Definir alcance tecnico",
        projectId: project.id,
        status: "NOT_STARTED",
        priority: "HIGH",
        ownerName: "Ingenieria",
        progress: 15,
        comments: "Pendiente validacion de requisitos",
      },
      {
        title: "Plan de pruebas piloto",
        projectId: project.id,
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        ownerName: "Calidad",
        progress: 55,
        comments: "En ejecucion de pruebas iniciales",
      },
    ],
  });

  await prisma.risk.create({
    data: {
      title: "Retraso de proveedor critico",
      description: "Posible retraso en entrega de utillaje principal",
      ownerName: "Compras",
      mitigationPlan: "Plan alternativo con proveedor secundario",
      targetDate: new Date(),
      projectId: project.id,
      status: "OPEN",
      probability: 4,
      impact: 4,
    },
  });

  await prisma.deliverable.createMany({
    data: [
      {
        projectId: project.id,
        title: "Plan de validacion",
        status: "IN_PROGRESS",
        description: "Documento de criterios y casos de prueba",
        raciA: "A",
        raciB: "R",
        raciC: "C",
        raciD: "I",
      },
      {
        projectId: project.id,
        title: "Informe de resultados piloto",
        status: "NOT_STARTED",
        description: "Resumen de resultados y recomendaciones",
        raciA: "A",
        raciB: "C",
        raciC: "R",
        raciD: "I",
      },
    ],
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

