import { timeToMinutes } from "./utils";

export function nowMinutesIST(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return h * 60 + m;
}

export function countUnmarkedEndedClasses(
  classes: Array<{ id: string; endTime: string }>,
  markedEntryIds: Set<string>,
  nowMinutes: number = nowMinutesIST()
): number {
  let count = 0;
  for (const cls of classes) {
    if (timeToMinutes(cls.endTime) >= nowMinutes) continue;
    if (!markedEntryIds.has(cls.id)) count++;
  }
  return count;
}

export const CLASS_REMINDER_PUSH = {
  title: "MSM — missed a class?",
  body: "Did you miss any class today? Record it now before you forget.",
  url: "/leave",
};

export const CLASS_REMINDER_EMAIL_SUBJECT =
  "Did you miss any class today? — MSM Control Center";

export function classReminderEmailHtml(firstName: string, appUrl: string) {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px; border-radius: 16px;">
      <p style="color: #22d3ee; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Daily reminder</p>
      <h1 style="font-size: 24px; margin: 16px 0;">Hey ${firstName}, quick check-in 👋</h1>
      <p style="color: #d4d4d8; line-height: 1.7;">
        Did you miss any class today? If yes, record your leave now so your attendance tracker stays accurate.
      </p>
      <a href="${appUrl}/leave" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #22d3ee, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
        Record leave now →
      </a>
      <p style="color: #71717a; font-size: 13px; margin-top: 24px;">
        You can turn off daily reminders from your MSM Control Center dashboard.
      </p>
    </div>
  `;
}
