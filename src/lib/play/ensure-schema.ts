import { prisma } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

/** Adds play/Sudoku columns on Supabase if missing (safe to run repeatedly). */
export function ensurePlaySchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const url = process.env.DATABASE_URL ?? "";
      if (!url.includes("postgresql")) return;

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "DailySudoku" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'mtsudoku';
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "DailySudoku" ADD COLUMN IF NOT EXISTS "seed" INTEGER;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "SudokuAttempt" ADD COLUMN IF NOT EXISTS "elapsedMs" INTEGER NOT NULL DEFAULT 0;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "SudokuAttempt" ADD COLUMN IF NOT EXISTS "timerStartedAt" TIMESTAMP(3);
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
