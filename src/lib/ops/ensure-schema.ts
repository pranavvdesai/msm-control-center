import { prisma } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export function ensureDailyOpsSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const url = process.env.DATABASE_URL ?? "";
      if (!url.includes("postgresql")) return;

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DailyOpsTask" (
          "id" TEXT NOT NULL,
          "istDate" TEXT NOT NULL,
          "taskKey" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "scheduledAtIst" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "metadata" TEXT,
          "completedAt" TIMESTAMP(3),
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DailyOpsTask_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "DailyOpsTask_istDate_taskKey_key"
        ON "DailyOpsTask"("istDate", "taskKey");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DailyOpsTask_istDate_idx"
        ON "DailyOpsTask"("istDate");
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
