import { prisma } from "./db";
import type { SessionUser } from "./auth";

/** Roll numbers allowed to upload timetable (Ram + Bhavya) */
export const UPLOAD_ROLL_NUMBERS = new Set(["25M136", "25M149"]);

export function canUpload(rollNumber: string | null | undefined): boolean {
  if (!rollNumber) return false;
  return UPLOAD_ROLL_NUMBERS.has(rollNumber.toUpperCase());
}

export async function sessionCanUpload(session: SessionUser | null): Promise<boolean> {
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { rollNumber: true },
  });
  return canUpload(user?.rollNumber);
}
