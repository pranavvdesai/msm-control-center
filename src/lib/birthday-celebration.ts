import { prisma } from "@/lib/db";
import { birthdayMatchesDate } from "@/lib/ops/ist-calendar";
import { getIstDateString } from "@/lib/play/ist-date";
import { firstName } from "@/lib/utils";

export const BIRTHDAY_SPLASH_KEY_PREFIX = "msm-birthday-splash-dismiss-v2";
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

function pickIndex(key: string, poolLength: number): number {
  if (poolLength === 0) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % poolLength;
}

export function wasBirthdaySplashSeenToday(date = new Date()) {
  try {
    return !!localStorage.getItem(getBirthdaySplashStorageKey(date));
  } catch {
    return false;
  }
}

export function markBirthdaySplashSeen(date = new Date()) {
  try {
    localStorage.setItem(getBirthdaySplashStorageKey(date), "1");
  } catch {
    /* ignore */
  }
}

export function clearBirthdaySplashSeen(date = new Date()) {
  try {
    localStorage.removeItem(getBirthdaySplashStorageKey(date));
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

const WISH_FEED_LINES = [
  "{from} lit a birthday candle for {to} — the cohort glows a little brighter 🎂",
  "With warmth from MSM, {from} sends birthday light to {to} ✨",
  "{from} whispered a verse of joy to {to} — may their day feel golden 🎂",
  "The batch stands taller when {from} celebrates {to} like this 🎉",
  "{from} folded a little poetry into {to}'s birthday morning 🎂",
];

const WISHER_SPLASH_LINES_SINGLE = [
  "The candles are lit and TAPMI pauses — lend {name} a verse of warmth before the day rushes on.",
  "Today {name} walks in with extra stardust — one heartfelt wish from you can make their whole morning glow.",
  "Roll {roll} belongs to someone we admire — scatter a little birthday poetry their way before class begins.",
  "The universe drafted {firstName} into MSM for a reason; today, remind them the cohort is cheering.",
];

const WISHER_SPLASH_LINES_MULTI = [
  "Several souls celebrate today — the batch grows brighter when we pause to wish them well.",
  "More than one candle burns in MSM today — lend each birthday friend a line of warmth.",
  "Term 4 bends a little for birthdays — send a chorus of wishes before the timetable steals the joy.",
];

export function buildWishFeedMessage(
  fromName: string,
  toFirstName: string,
  istDate = getIstDateString()
) {
  const from = firstName(fromName);
  const line =
    WISH_FEED_LINES[pickIndex(`${from}:${toFirstName}:${istDate}:feed`, WISH_FEED_LINES.length)];
  return line.replace("{from}", from).replace("{to}", toFirstName);
}

export function getWisherSplashCopy(
  people: BirthdayPerson[],
  istDate = getIstDateString()
) {
  if (people.length === 1) {
    const person = people[0];
    const line =
      WISHER_SPLASH_LINES_SINGLE[
        pickIndex(`${person.rollNumber}:${istDate}:splash`, WISHER_SPLASH_LINES_SINGLE.length)
      ];
    return line
      .replace(/\{name\}/g, person.name)
      .replace(/\{firstName\}/g, person.firstName)
      .replace(/\{roll\}/g, person.rollNumber);
  }

  const names = people.map((p) => p.firstName).join(", ");
  const line =
    WISHER_SPLASH_LINES_MULTI[
      pickIndex(`${istDate}:${people.map((p) => p.rollNumber).join("-")}:splash`, WISHER_SPLASH_LINES_MULTI.length)
    ];
  return `${line} Wish ${names} before the day slips away.`;
}

export function getSendWishButtonLabel(
  people: BirthdayPerson[],
  pendingCount: number,
  sending = false
) {
  if (sending) return "Carrying your wish across the cohort…";
  if (pendingCount === 0) return "Your warmth already reached them ✓";

  if (people.length === 1) {
    return `Send a verse of joy to ${people[0].firstName} 🎂`;
  }

  return `Scatter wishes among the stars (${pendingCount}) ✨`;
}

export function buildWishSuccessMessage(
  createdCount: number,
  birthdayPeople: BirthdayPerson[],
  createdIds: string[]
) {
  if (createdCount === 0) {
    return "Your wishes were already waiting for them — the love is felt.";
  }

  if (createdCount === 1) {
    const target = birthdayPeople.find((p) => p.id === createdIds[0]);
    return target
      ? `Your wish flew to ${target.firstName}'s Home — may their day glow with it.`
      : "Your wish is on its way — may their day glow with it.";
  }

  return `Poems of cheer delivered to ${createdCount} friends — the batch shines a little brighter tonight.`;
}

export function buildWishToastMessage(fromFirstName: string) {
  return `${fromFirstName} sent you a birthday verse — the cohort is celebrating you 🎂`;
}
