import { prisma } from "@/lib/db";
import { birthdayMatchesDate } from "@/lib/ops/ist-calendar";
import { getIstDateString } from "@/lib/play/ist-date";
import { firstName } from "@/lib/utils";

export const BIRTHDAY_SPLASH_KEY_PREFIX = "msm-birthday-splash-dismiss";
export const BIRTHDAY_REPLAY_SESSION_KEY = "msm-replay-birthday";

export type BirthdayPerson = {
  id: string;
  name: string;
  firstName: string;
  rollNumber: string;
};

let schemaReady: Promise<void> | null = null;

export function ensureBirthdayWishSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const url = process.env.DATABASE_URL ?? "";
      if (!url.includes("postgresql")) return;

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "BirthdayWish" (
          "id" TEXT NOT NULL,
          "fromUserId" TEXT NOT NULL,
          "toUserId" TEXT NOT NULL,
          "istDate" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BirthdayWish_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "BirthdayWish_fromUserId_toUserId_istDate_key"
        ON "BirthdayWish"("fromUserId", "toUserId", "istDate");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "BirthdayWish_toUserId_istDate_idx"
        ON "BirthdayWish"("toUserId", "istDate");
      `);
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export function getBirthdaySplashStorageKey(date = new Date()) {
  return `${BIRTHDAY_SPLASH_KEY_PREFIX}-${getIstDateString(date)}`;
}

export function wasBirthdaySplashSeenToday(date = new Date()) {
  try {
    return !!sessionStorage.getItem(getBirthdaySplashStorageKey(date));
  } catch {
    return false;
  }
}

export function markBirthdaySplashSeen(date = new Date()) {
  try {
    sessionStorage.setItem(getBirthdaySplashStorageKey(date), "1");
  } catch {
    /* ignore */
  }
}

export function clearBirthdaySplashSeen(date = new Date()) {
  try {
    sessionStorage.removeItem(getBirthdaySplashStorageKey(date));
  } catch {
    /* ignore */
  }
}

export function enableBirthdayReplay() {
  try {
    sessionStorage.setItem(BIRTHDAY_REPLAY_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function shouldReplayBirthdaySplash() {
  try {
    return sessionStorage.getItem(BIRTHDAY_REPLAY_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearBirthdayReplayFlag() {
  try {
    sessionStorage.removeItem(BIRTHDAY_REPLAY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export async function getTodaysBirthdayPeople(istDate = getIstDateString()): Promise<BirthdayPerson[]> {
  const users = await prisma.user.findMany({
    where: { profileComplete: true, birthday: { not: null } },
    select: { id: true, name: true, rollNumber: true, birthday: true },
    orderBy: { name: "asc" },
  });

  return users
    .filter((u) => u.birthday && birthdayMatchesDate(u.birthday, istDate))
    .map((u) => ({
      id: u.id,
      name: u.name,
      firstName: firstName(u.name),
      rollNumber: u.rollNumber,
    }));
}

export function buildWishFeedMessage(fromName: string, toFirstName: string) {
  return `${firstName(fromName)} wished ${toFirstName} happy birthday 🎂`;
}
