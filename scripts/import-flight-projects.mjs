import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCE_PROJECTS = [
  { id: 1, type: "E", name: "Fase 2026", leader: "Naiara", keyChallenges: "Identificación de motas bajas. Identificación de parámetros clave de generación de defectos y rangos de trabajo." },
  { id: 2, type: "E", name: "VAS", leader: "Maider", keyChallenges: "Automatizar la inspección visual mediante un sistema de visión artificial." },
  { id: 3, type: "E", name: "Relevo generacional y desarrollo de capacidades del equipo actual", leader: "Asier", keyChallenges: "Traccionar las primeras pruebas de relevo generacional y nueva gestión de personas." },
  { id: 4, type: "E", name: "Advanced Plant", leader: "Rubén", keyChallenges: "Implantación de un evolutivo de PDCapture para monitorizar la planta en tiempo real." },
  { id: 5, type: "E", name: "Nuevo pabellón inspección y almacenaje", leader: "David", keyChallenges: "Desarrollo de pabellón cercano a planta y traslado de operaciones de verificación/logística sin impacto en clientes." },
  { id: 7, type: "E", name: "Transporte automático de metal", leader: "Javi Pinto", keyChallenges: "Instalación de equipos, planificación de la puesta en marcha y cierre de layout." },
  { id: 8, type: "E", name: "Renovación Nueva Línea", leader: "Iker", keyChallenges: "Movimiento de granalladora L2, obra civil vibrantes, instalación de molino y activación PAPI." },
  { id: 10, type: "E", name: "Agente IA para Mtto", leader: "Rubén", keyChallenges: "" },
  { id: 11, type: "E", name: "Automatización rotura", leader: "Iker", keyChallenges: "Organizar prueba de factibilidad de extracción de molde." },
  { id: 1, type: "T", name: "Desarrollo Organizativo Producción", leader: "Naiara", keyChallenges: "Implantación de la reunión mensual de Producción." },
  { id: 2, type: "T", name: "Desarrollo Organizativo Ingeniería", leader: "Eli", keyChallenges: "" },
  { id: 3, type: "T", name: "Desarrollo Organizativo Calidad", leader: "Maider", keyChallenges: "" },
  { id: 4, type: "T", name: "Láser colada 1", leader: "Isabel", keyChallenges: "" },
  { id: 5, type: "T", name: "Nuevo Taller Utillajes", leader: "Josune", keyChallenges: "" },
  { id: 6, type: "T", name: "Optimización Productividad Eurocen y Urbegi", leader: "Naiara", keyChallenges: "EUR: definición de objetivos + plan de acción. URB: traslado de última mesa + plan de acción." },
  { id: 7, type: "T", name: "Impulso Clima Laboral", leader: "Obedia", keyChallenges: "" },
  { id: 8, type: "T", name: "Renovación cabina espectrómetro, DISA y oficinas", leader: null, keyChallenges: "" },
  { id: 10, type: "T", name: "Reducción Ruido Exterior", leader: "Asier", keyChallenges: "" },
];

function mapPriority(type) {
  if (type === "E") return "HIGH";
  if (type === "T") return "MEDIUM";
  return "LOW";
}

function mapProjectType(type) {
  if (type === "E") return "ESTRATEGICO";
  if (type === "T") return "TACTICO";
  return "OPERATIVO";
}

function mapTypeLabel(type) {
  if (type === "E") return "Estratégico";
  if (type === "T") return "Táctico";
  if (type === "O") return "Operativo";
  return "Operativo";
}

function buildDescription(type, keyChallenges) {
  const typeLabel = mapTypeLabel(type);
  const cleanChallenges = keyChallenges?.trim() ?? "";
  if (!cleanChallenges) return `Tipo: ${typeLabel}`;
  return `Tipo: ${typeLabel}\n\nKey challenges:\n${cleanChallenges}`;
}

async function main() {
  let imported = 0;

  for (const source of SOURCE_PROJECTS) {
    const code = `EXCEL-${source.type}-${source.id}`;
    const name = source.name.trim();
    if (!name) continue;

    await prisma.project.upsert({
      where: { code },
      update: {
        name,
        plant: "Atxondo",
        projectType: mapProjectType(source.type),
        phase: "DEFINICION",
        status: "ACTIVE",
        priority: mapPriority(source.type),
        ownerName: source.leader?.trim() || null,
        description: buildDescription(source.type, source.keyChallenges),
      },
      create: {
        code,
        name,
        plant: "Atxondo",
        projectType: mapProjectType(source.type),
        phase: "DEFINICION",
        status: "ACTIVE",
        priority: mapPriority(source.type),
        ownerName: source.leader?.trim() || null,
        description: buildDescription(source.type, source.keyChallenges),
      },
    });

    imported += 1;
  }

  console.log(`Import completed. Projects upserted: ${imported}`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
