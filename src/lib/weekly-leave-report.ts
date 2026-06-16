import { prisma } from "./db";
import { buildSubjectStats, getSubjectAlert } from "./alerts";
import { formatDate } from "./utils";
import { isExcludedSubject } from "./subjects";

export type WeeklyLeaveReport = {
  subjectStats: Array<{
    subjectName: string;
    regularAbsences: number;
    condonedLeaves: number;
    maxLeaves: number;
    remainingLeaves: number;
    alertLevel: string;
  }>;
  weekLeaves: Array<{
    date: string;
    subjectName: string;
    type: string;
    time: string | null;
  }>;
  totalRegular: number;
  totalCondoned: number;
  weekRegular: number;
  weekCondoned: number;
};

export async function buildUserLeaveReport(userId: string): Promise<WeeklyLeaveReport> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  const trackableSubjects = subjects.filter((s) => !isExcludedSubject(s.name));
  const leaves = await prisma.leave.findMany({
    where: { userId },
    include: { subject: true, timetableEntry: true },
    orderBy: { date: "desc" },
  });

  const subjectStats = trackableSubjects.map((subject) => {
    const subjectLeaves = leaves.filter((l) => l.subjectId === subject.id);
    const regularAbsences = subjectLeaves.filter((l) => l.type === "REGULAR").length;
    const condonedLeaves = subjectLeaves.filter((l) => l.type === "CONDONED").length;
    const stats = buildSubjectStats(
      subject.name,
      subject.credits,
      regularAbsences,
      condonedLeaves
    );
    const alert = getSubjectAlert(stats);
    return {
      subjectName: stats.subjectName,
      regularAbsences: stats.regularAbsences,
      condonedLeaves: stats.condonedLeaves,
      maxLeaves: stats.maxLeaves,
      remainingLeaves: stats.remainingLeaves,
      alertLevel: alert.level,
    };
  });

  const weekLeaves = leaves
    .filter((l) => new Date(l.date) >= weekStart)
    .map((l) => ({
      date: formatDate(l.date),
      subjectName: l.subject.name,
      type: l.type,
      time: l.timetableEntry
        ? `${l.timetableEntry.startTime} – ${l.timetableEntry.endTime}`
        : null,
    }));

  const totalRegular = leaves.filter((l) => l.type === "REGULAR").length;
  const totalCondoned = leaves.filter((l) => l.type === "CONDONED").length;
  const weekRegular = weekLeaves.filter((l) => l.type === "REGULAR").length;
  const weekCondoned = weekLeaves.filter((l) => l.type === "CONDONED").length;

  return {
    subjectStats,
    weekLeaves,
    totalRegular,
    totalCondoned,
    weekRegular,
    weekCondoned,
  };
}

function alertColor(level: string): string {
  if (level === "critical") return "#ef4444";
  if (level === "warning") return "#f59e0b";
  if (level === "caution") return "#eab308";
  return "#22c55e";
}

export function weeklyLeaveReportEmailHtml(
  firstName: string,
  report: WeeklyLeaveReport,
  appUrl: string
): string {
  const subjectRows = report.subjectStats
    .map(
      (s) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#f4f4f5;">${s.subjectName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#fca5a5;text-align:center;">${s.regularAbsences}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#c4b5fd;text-align:center;">${s.condonedLeaves}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #27272a;color:#67e8f9;text-align:center;">${s.remainingLeaves} / ${s.maxLeaves}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #27272a;text-align:center;">
          <span style="color:${alertColor(s.alertLevel)};font-size:11px;text-transform:uppercase;font-weight:600;">${s.alertLevel}</span>
        </td>
      </tr>`
    )
    .join("");

  const weekSection =
    report.weekLeaves.length > 0
      ? `
      <h2 style="color:#f4f4f5;font-size:16px;margin:28px 0 12px;">This week&apos;s recorded leaves</h2>
      <ul style="margin:0;padding:0 0 0 18px;color:#d4d4d8;line-height:1.8;">
        ${report.weekLeaves
          .map(
            (l) =>
              `<li><strong>${l.subjectName}</strong> — ${l.date}${l.time ? ` (${l.time})` : ""} · ${l.type === "REGULAR" ? "Regular absence" : "Condoned leave"}</li>`
          )
          .join("")}
      </ul>`
      : `
      <p style="color:#a1a1aa;margin:20px 0;line-height:1.6;">
        No leaves recorded this past week. If you missed any class, please log it below.
      </p>`;

  return `
    <div style="font-family:system-ui,sans-serif;max-width:620px;margin:0 auto;background:#030014;color:#f4f4f5;padding:32px;border-radius:16px;">
      <p style="color:#22d3ee;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0;">Weekly leave report</p>
      <h1 style="font-size:24px;margin:16px 0 8px;">Hey ${firstName}, here&apos;s your attendance snapshot</h1>
      <p style="color:#a1a1aa;line-height:1.6;margin:0 0 24px;">
        Sent every Saturday at 5 PM. Review your leave balance and register any classes you missed this week.
      </p>

      <div style="display:flex;gap:12px;margin-bottom:24px;">
        <div style="flex:1;background:#18181b;border-radius:12px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;">Regular (term)</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#fca5a5;">${report.totalRegular}</p>
        </div>
        <div style="flex:1;background:#18181b;border-radius:12px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;">Condoned (term)</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#c4b5fd;">${report.totalCondoned}</p>
        </div>
        <div style="flex:1;background:#18181b;border-radius:12px;padding:14px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#71717a;text-transform:uppercase;">This week</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#67e8f9;">${report.weekRegular + report.weekCondoned}</p>
        </div>
      </div>

      <h2 style="color:#f4f4f5;font-size:16px;margin:0 0 12px;">Subject-wise leave report</h2>
      ${
        report.subjectStats.length > 0
          ? `
      <table style="width:100%;border-collapse:collapse;background:#0a0a1a;border-radius:12px;overflow:hidden;font-size:13px;">
        <thead>
          <tr style="background:#18181b;">
            <th style="padding:10px 12px;text-align:left;color:#71717a;font-size:11px;text-transform:uppercase;">Subject</th>
            <th style="padding:10px 12px;text-align:center;color:#71717a;font-size:11px;text-transform:uppercase;">Regular</th>
            <th style="padding:10px 12px;text-align:center;color:#71717a;font-size:11px;text-transform:uppercase;">Condoned</th>
            <th style="padding:10px 12px;text-align:center;color:#71717a;font-size:11px;text-transform:uppercase;">Left</th>
            <th style="padding:10px 12px;text-align:center;color:#71717a;font-size:11px;text-transform:uppercase;">Status</th>
          </tr>
        </thead>
        <tbody>${subjectRows}</tbody>
      </table>`
          : `<p style="color:#71717a;">No subjects loaded yet. Check back after the timetable is uploaded.</p>`
      }

      ${weekSection}

      <div style="margin-top:28px;padding:16px;background:#172554;border-radius:12px;border:1px solid #1e40af;">
        <p style="margin:0;color:#bfdbfe;line-height:1.6;font-size:14px;">
          <strong>Missed a class this week?</strong> If you took any leave and haven&apos;t registered it yet,
          log it now so your attendance tracker stays accurate.
        </p>
      </div>

      <a href="${appUrl}/leave" style="display:inline-block;margin-top:20px;padding:14px 28px;background:linear-gradient(135deg,#22d3ee,#8b5cf6);color:white;text-decoration:none;border-radius:12px;font-weight:600;">
        Register leave now →
      </a>

      <p style="color:#52525b;font-size:12px;margin-top:28px;line-height:1.5;">
        MSM Control Center · TAPMI Manipal<br/>
        You receive this every Saturday at 5 PM IST.
      </p>
    </div>
  `;
}

export const WEEKLY_LEAVE_REPORT_SUBJECT =
  "Your weekly leave report — MSM Control Center";
