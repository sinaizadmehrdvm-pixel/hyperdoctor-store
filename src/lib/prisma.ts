import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

if (process.env.NODE_ENV === "production") {
  try {
    const parsed = new URL(connectionString);
    console.info("[db-config]", {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      username: parsed.username,
      database: parsed.pathname.replace(/^\//, ""),
      hasPasswordPlaceholder: connectionString.includes("[YOUR-PASSWORD]"),
    });
  } catch {
    console.info("[db-config]", {
      parseable: false,
      hasPasswordPlaceholder: connectionString.includes("[YOUR-PASSWORD]"),
    });
  }
}

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
