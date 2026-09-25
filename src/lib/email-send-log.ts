import { prisma } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

export type EmailSendKind =
  | "birthday_batch"
  | "weekly_leave_batch"
  | "class_reminder_batch";

export function ensureEmailSendLogSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const url = process.env.DATABASE_URL ?? "";
      if (!url.includes("postgresql")) return;

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "EmailSendLog" (
          "id" TEXT NOT NULL,
          "kind" TEXT NOT NULL,
          "istDate" TEXT NOT NULL,
          "metadata" TEXT,
          "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EmailSendLog_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "EmailSendLog_kind_istDate_key"
        ON "EmailSendLog"("kind", "istDate");
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/** Returns true if this batch was already sent for the IST date (prevents duplicate cron fires). */
export async function wasEmailBatchSent(kind: EmailSendKind, istDate: string): Promise<boolean> {
  const row = await getEmailBatchLog(kind, istDate);
  return !!row;
}

export async function getEmailBatchLog(kind: EmailSendKind, istDate: string) {
  await ensureEmailSendLogSchema();
  return prisma.emailSendLog.findUnique({
    where: { kind_istDate: { kind, istDate } },
  });
}

export async function markEmailBatchSent(
  kind: EmailSendKind,
  istDate: string,
  metadata?: Record<string, unknown>
) {
  await ensureEmailSendLogSchema();
  const metadataStr = metadata ? JSON.stringify(metadata) : null;
  try {
    await prisma.emailSendLog.create({
      data: {
        kind,
        istDate,
        metadata: metadataStr,
      },
    });
  } catch {
    await prisma.emailSendLog.updateMany({
      where: { kind, istDate },
      data: { metadata: metadataStr, sentAt: new Date() },
    });
  }
}

export async function clearEmailBatchLog(kind: EmailSendKind, istDate: string) {
  await ensureEmailSendLogSchema();
  await prisma.emailSendLog.deleteMany({ where: { kind, istDate } });
}
