import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// On Vercel serverless functions, the root filesystem is read-only.
// We copy the seeded database to /tmp so SQLite is both readable and writeable.
function setupDatabaseUrl(): string {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    // External database (Postgres, MySQL, etc.)
    return process.env.DATABASE_URL;
  }

  // Running on Vercel or production serverless
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = "/tmp/dev.db";
    const srcDbPath = path.join(process.cwd(), "prisma", "dev.db");

    try {
      if (!fs.existsSync(tmpDbPath)) {
        if (fs.existsSync(srcDbPath)) {
          fs.copyFileSync(srcDbPath, tmpDbPath);
        }
      }
    } catch (e) {
      console.warn("Could not copy sqlite to /tmp:", e);
    }

    return "file:" + tmpDbPath;
  }

  // Local development fallback
  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = setupDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: dbUrl,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
