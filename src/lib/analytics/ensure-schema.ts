import { prisma } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureAnalyticsSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const url = process.env.DATABASE_URL ?? "";
      if (!url.includes("postgresql")) return;

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "PageVisit" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "tab" TEXT NOT NULL,
          "path" TEXT NOT NULL,
          "visitDate" TEXT NOT NULL,
          "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PageVisit_visitDate_idx" ON "PageVisit"("visitDate");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PageVisit_tab_visitDate_idx" ON "PageVisit"("tab", "visitDate");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "PageVisit_userId_visitDate_idx" ON "PageVisit"("userId", "visitDate");
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
