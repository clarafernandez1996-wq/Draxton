import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function normalizeDatabaseUrl(value: string | undefined) {
  if (!value) return "";

  const trimmed = value.trim();
  return trimmed.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
const directUrl = normalizeDatabaseUrl(process.env.DATABASE_URL_UNPOOLED);

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
} else if (directUrl) {
  process.env.DATABASE_URL = directUrl;
}

process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
