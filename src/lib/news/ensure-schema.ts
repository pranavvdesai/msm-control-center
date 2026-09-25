import { prisma } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

/** Creates NewsDailyCache on Supabase if the table is missing. */
export function ensureNewsSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const url = process.env.DATABASE_URL ?? "";
      if (!url.includes("postgresql")) return;

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "NewsDailyCache" (
          "id" TEXT NOT NULL,
          "newsDate" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "items" TEXT NOT NULL,
          "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "NewsDailyCache_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "NewsDailyCache_newsDate_category_key"
        ON "NewsDailyCache"("newsDate", "category");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "NewsDailyCache_newsDate_idx"
        ON "NewsDailyCache"("newsDate");
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
