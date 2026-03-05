import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl || (!dbUrl.startsWith("file:") && !dbUrl.startsWith("file://"))) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}
process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
