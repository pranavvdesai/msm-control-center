import { getIstDateString } from "@/lib/play/ist-date";
import { RAM_ROLL } from "@/lib/permissions";

/** Ram J Pareek — July 4 (IST) */
export const RAM_BIRTHDAY_MONTH = 7;
export const RAM_BIRTHDAY_DAY = 4;
export const RAM_DISPLAY_NAME = "Ram J Pareek";
export const RAM_FIRST_NAME = "Ram";

export const RAM_BIRTHDAY_SPLASH_KEY_PREFIX = "msm-ram-birthday-splash-v2";
export const RAM_BIRTHDAY_REPLAY_SESSION_KEY = "msm-replay-birthday";

export function isRamBirthdayToday(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 0);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 0);
  return month === RAM_BIRTHDAY_MONTH && day === RAM_BIRTHDAY_DAY;
}

export function getRamBirthdaySplashStorageKey(date = new Date()): string {
  return `${RAM_BIRTHDAY_SPLASH_KEY_PREFIX}-${getIstDateString(date)}`;
}

export function wasRamBirthdaySplashSeenToday(): boolean {
  try {
    return !!localStorage.getItem(getRamBirthdaySplashStorageKey());
  } catch {
    return false;
  }
}

export function markRamBirthdaySplashSeen(): void {
  try {
    localStorage.setItem(getRamBirthdaySplashStorageKey(), "1");
  } catch {
    /* private mode / blocked storage */
  }
}

export function clearRamBirthdaySplashSeen(): void {
  try {
    localStorage.removeItem(getRamBirthdaySplashStorageKey());
  } catch {
    /* ignore */
  }
}

export function shouldReplayRamBirthdaySplash(): boolean {
  try {
    return sessionStorage.getItem(RAM_BIRTHDAY_REPLAY_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function enableRamBirthdayReplay(): void {
  try {
    sessionStorage.setItem(RAM_BIRTHDAY_REPLAY_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearRamBirthdayReplayFlag(): void {
  try {
    sessionStorage.removeItem(RAM_BIRTHDAY_REPLAY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isRamRoll(rollNumber: string | null | undefined): boolean {
  if (!rollNumber) return false;
  return rollNumber.toUpperCase() === RAM_ROLL;
}

export function ramBirthdayWhatsAppUrl(message?: string) {
  const text =
    message ??
    "Happy Birthday Ram! 🎂 The whole MSM cohort is celebrating you today — thank you for building the Control Center for us! 🙏";
  return `https://wa.me/918302854099?text=${encodeURIComponent(text)}`;
}

/** Poem shown only when Ram opens the app on his birthday. */
export const RAM_BIRTHDAY_POEM = `Ram, you built the gates we walk through each day —
The leave calendar, the radar, the feed on display.
You stayed up deploying while we slept without care,
And handed us magic we didn't know was there.

From G2 corridors to the dashboard's soft glow,
You're the architect MSM was lucky to know.
The cohort won't quarantine love for their friend —
Happy Birthday, dear Ram. May the joy never end.

Today the timetable bends — just for you.
The whole MSM family sings this as true:
Roll 25M136, our builder, our star —
The Control Center shines because of who you are.`;
