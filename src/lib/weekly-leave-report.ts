import { prisma } from "./db";
import { buildSubjectStats, getSubjectAlert } from "./alerts";
import { countLeavesByType, leaveTypeLabel, type LeaveType } from "./leaves";
import { MSM_EMAIL_FOOTER } from "./email-config";
import { formatDate } from "./utils";
import type { WeeklyPlatformChampion } from "@/lib/analytics/weekly-champion";
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
    const { regularAbsences, condonedLeaves, lateMarks } = countLeavesByType(subjectLeaves);
    const stats = buildSubjectStats(
      subject.name,
      subject.credits,
      regularAbsences,
      condonedLeaves,
      lateMarks
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

function weeklyChampionCertificateHtml(champion: WeeklyPlatformChampion): string {
  return `
      <div style="margin-top:36px;">
        <p style="margin:0 0 14px;color:#d4d4d8;font-size:12px;text-align:center;text-transform:uppercase;letter-spacing:2px;">
          Cohort highlight · most active on the platform this week
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:8px;background:#b8860b;border:4px solid #8b6914;border-radius:6px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fffef8;border:2px solid #d4af37;">
                <tr>
                  <td style="padding:32px 28px 28px;text-align:center;background:#fffef8;">
                    <p style="margin:0 0 10px;color:#1c1917;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">
                      MSM Control Center
                    </p>
                    <p style="margin:0 0 6px;color:#292524;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                      Certificate of Platform Excellence
                    </p>
                    <p style="margin:0 0 22px;color:#44403c;font-size:12px;font-weight:600;">
                      Week of ${champion.weekStart} to ${champion.weekEnd}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
                      <tr><td style="height:2px;background:#d4af37;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:0 0 12px;color:#292524;font-size:14px;font-weight:600;font-style:italic;">
                      This certifies that
                    </p>
                    <p style="margin:0 0 10px;color:#000000;font-size:32px;font-weight:900;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">
                      ${champion.name}
                    </p>
                    <p style="margin:0 0 20px;color:#1c1917;font-size:16px;font-weight:800;letter-spacing:1px;">
                      ${champion.rollNumber}
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:18px;">
                      <tr><td style="height:2px;background:#d4af37;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:0 auto;color:#1c1917;font-size:15px;font-weight:600;line-height:1.75;max-width:440px;">
                      has been the <strong style="color:#000;">most active member</strong> of the MSM cohort on the platform this week
                      with <strong style="color:#000;">${champion.visits} tab visits</strong> — well utilised, well engaged.
                    </p>
                    <p style="margin:22px 0 0;color:#57534e;font-size:12px;font-weight:600;">
                      🏆 Awarded by Ram&apos;s MSM bot
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>`;
}

export function weeklyLeaveReportEmailHtml(
  firstName: string,
  report: WeeklyLeaveReport,
  appUrl: string,
  champion?: WeeklyPlatformChampion | null
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
      <h2 style="color:#f4f4f5;font-size:16px;margin:28px 0 12px;">This week&apos;s leave history</h2>
      <ul style="margin:0;padding:0 0 0 18px;color:#d4d4d8;line-height:1.8;">
        ${report.weekLeaves
          .map(
            (l) =>
              `<li><strong>${l.subjectName}</strong> — ${l.date}${l.time ? ` (${l.time})` : ""} · ${leaveTypeLabel(l.type as LeaveType)}</li>`
          )
          .join("")}
      </ul>`
      : `
      <p style="color:#a1a1aa;margin:20px 0;line-height:1.6;">
        No leaves recorded this past week. If you missed any class, please log it below.
      </p>`;

  return `
    <div style="font-family:system-ui,sans-serif;max-width:620px;margin:0 auto;background:#030014;color:#f4f4f5;padding:32px;border-radius:16px;">
      <div style="margin-bottom:20px;padding:14px 16px;background:#0a0a1a;border-radius:12px;border:1px solid #22d3ee33;">
        <p style="margin:0;color:#fde68a;font-size:14px;line-height:1.7;font-weight:600;">
          Hello — this is an automated weekly mail from Ram&apos;s MSM bot.
        </p>
        <p style="margin:10px 0 0;color:#d4d4d8;font-size:14px;line-height:1.7;">
          It&apos;s here to remind you to <strong style="color:#fff;">log any missed classes</strong> you haven&apos;t registered yet,
          and to show your <strong style="color:#fff;">leaves &amp; history</strong> at a glance.
        </p>
      </div>

      <p style="color:#22d3ee;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0;">Weekly leave report</p>
      <h1 style="font-size:24px;margin:16px 0 8px;">Hey ${firstName}, here&apos;s your attendance snapshot</h1>
      <p style="color:#a1a1aa;line-height:1.6;margin:0 0 24px;">
        Sent every Saturday at 5 PM IST · subject-wise balance + this week&apos;s leave history below.
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

      <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px;">
        <a href="${appUrl}/leave" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#22d3ee,#8b5cf6);color:white;text-decoration:none;border-radius:12px;font-weight:600;">
          Log missed class →
        </a>
        <a href="${appUrl}/history" style="display:inline-block;padding:14px 28px;background:#18181b;color:#fafafa;text-decoration:none;border-radius:12px;font-weight:600;border:1px solid #3f3f46;">
          View full history →
        </a>
      </div>

      ${champion ? weeklyChampionCertificateHtml(champion) : ""}

      <p style="color:#52525b;font-size:12px;margin-top:28px;line-height:1.5;">
        MSM Control Center · TAPMI Manipal<br/>
        You receive this every Saturday at 5 PM IST.
      </p>
      ${MSM_EMAIL_FOOTER}
    </div>
  `;
}

export const WEEKLY_LEAVE_REPORT_SUBJECT =
  "Weekly reminder — log missed classes & check your leaves · MSM";
