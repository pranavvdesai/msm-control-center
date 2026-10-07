export const TERM5_WELCOME_SUBJECT =
  "Welcome to Term 5 — fresh timetable, clean slate, keep using MSM Control Center 🚀";

export function term5WelcomeEmailHtml(firstName: string, appUrl: string) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px 28px; border-radius: 16px;">
      <p style="color: #22d3ee; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; text-align: center; margin: 0;">MSM Control Center</p>

      <p style="color: #fde68a; font-size: 15px; line-height: 1.7; margin: 20px 0 8px; text-align: center; font-weight: 600;">
        Hello namaste from Ram&apos;s personal bot assistant — this is an automated mail!!
      </p>

      <h1 style="font-size: 24px; margin: 12px 0 16px; text-align: center; line-height: 1.3;">
        Hey ${firstName} — welcome to Term 5 🎉
      </h1>

      <p style="color: #d4d4d8; line-height: 1.75; font-size: 16px; margin: 0 0 8px;">
        New term, new subjects, new energy. The <strong style="color:#fff;">Term 5 timetable is freshly loaded</strong>
        on MSM Control Center — leave counters are reset, old Term 4 subjects are gone, and you&apos;re starting clean.
        Same login. Same roll number. Same cohort password. Just open the app and keep using it like Term 4.
      </p>

      <div style="margin: 28px 0; padding: 20px; background: #0a0a1a; border-radius: 14px; border: 1px solid #22d3ee55;">
        <p style="margin: 0 0 10px; color: #22d3ee; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">📊 Term 4 wrap — the numbers don&apos;t lie</p>
        <p style="margin: 0 0 12px; color: #d4d4d8; line-height: 1.75; font-size: 15px;">
          Before we dive into Term 5, a quick salute to how hard this cohort used the platform last term:
        </p>
        <p style="margin: 0 0 6px; color: #a78bfa; font-size: 13px; font-weight: 600;">Most used tabs</p>
        <ul style="color: #d4d4d8; line-height: 1.85; font-size: 15px; padding-left: 20px; margin: 0 0 14px;">
          <li><strong style="color:#fff;">Home</strong> — 1,492 visits</li>
          <li><strong style="color:#fff;">Timetable</strong> — 1,347 visits</li>
          <li><strong style="color:#fff;">Leave</strong> — 553 visits</li>
        </ul>
        <p style="margin: 0 0 6px; color: #a78bfa; font-size: 13px; font-weight: 600;">Most active students</p>
        <ul style="color: #d4d4d8; line-height: 1.85; font-size: 15px; padding-left: 20px; margin: 0 0 14px;">
          <li><strong style="color:#fff;">Tanmay Singh</strong> — 402 visits</li>
          <li><strong style="color:#fff;">Ayush Kumar</strong> — 368 visits</li>
          <li><strong style="color:#fff;">Reshikesh C</strong> — 366 visits</li>
        </ul>
        <p style="margin: 0 0 6px; color: #a78bfa; font-size: 13px; font-weight: 600;">Most leaves marked</p>
        <ul style="color: #d4d4d8; line-height: 1.85; font-size: 15px; padding-left: 20px; margin: 0 0 14px;">
          <li><strong style="color:#fff;">Tanmay Singh</strong> — 22 leaves (17 regular + 5 condoned)</li>
          <li><strong style="color:#fff;">Unnikrishnan R Menon</strong> — 15 leaves (12 regular + 3 condoned)</li>
          <li><strong style="color:#fff;">Niharika Nayan Jha</strong> &amp; <strong style="color:#fff;">Kashish Bhutada</strong> — 12 each</li>
        </ul>
        <p style="margin: 0 0 6px; color: #a78bfa; font-size: 13px; font-weight: 600;">Most active on the feed</p>
        <ul style="color: #d4d4d8; line-height: 1.85; font-size: 15px; padding-left: 20px; margin: 0;">
          <li><strong style="color:#fff;">Pranav Arora</strong> — 81 events</li>
          <li><strong style="color:#fff;">Mihika Nair</strong> — 49 events</li>
          <li><strong style="color:#fff;">Tanmay Singh</strong> — 40 events</li>
        </ul>
        <p style="margin: 14px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.7;">
          Term 4 proved one thing: when the cohort shows up on the app, attendance chaos becomes manageable.
          Let&apos;s do Term 5 even louder.
        </p>
      </div>

      <div style="margin: 28px 0; padding: 20px; background: #0a0a1a; border-radius: 14px; border: 1px solid #8b5cf655;">
        <p style="margin: 0 0 10px; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">✅ What&apos;s live for Term 5</p>
        <ul style="color: #d4d4d8; line-height: 1.9; font-size: 15px; padding-left: 20px; margin: 0;">
          <li>Fresh Term 5 timetable (Sep 26 onwards)</li>
          <li>Clean leave slate for every subject</li>
          <li>Dashboard, Leave, Timetable, History — all ready</li>
          <li>Play, News, Cake Radar — still there when you need a break</li>
        </ul>
      </div>

      <div style="margin: 28px 0; padding: 18px; background: #18181b; border-radius: 12px; border: 1px solid #3f3f46; text-align: center;">
        <p style="margin: 0 0 14px; color: #fafafa; font-size: 16px; font-weight: 600; line-height: 1.5;">
          Term 5 is live. Mark leaves on time. Check the timetable before you bunk. Keep the streak going.
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #22d3ee, #8b5cf6); color: white; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px;">
          Open MSM Control Center →
        </a>
      </div>

      <p style="color: #71717a; line-height: 1.7; font-size: 13px; margin: 20px 0 0; text-align: center;">
        Login with your roll number &amp; cohort password, same as always.<br/>
        See you in G2 — and on the dashboard.
      </p>

      <p style="color: #52525b; font-size: 11px; margin-top: 28px; text-align: center; line-height: 1.6;">
        Automated message from Ram&apos;s bot · MSM Control Center · TAPMI Manipal · Term 5<br/>
        Built with love for the cohort — Ram &amp; team
      </p>
    </div>
  `;
}

/** Plain-text / WhatsApp version of the same announcement */
export const TERM5_WELCOME_WHATSAPP = `Namaste MSM 🙏

Welcome to Term 5!! 🎉

The Term 5 timetable is freshly loaded on MSM Control Center — leave counters are reset, old Term 4 subjects are cleared, and you’re starting clean. Same login, same roll number, same cohort password. Just keep using the app.

📊 Term 4 wrap — the numbers:

Most used tabs:
• Home — 1,492 visits
• Timetable — 1,347 visits
• Leave — 553 visits

Most active students:
• Tanmay Singh — 402 visits
• Ayush Kumar — 368 visits
• Reshikesh C — 366 visits

Most leaves marked:
• Tanmay Singh — 22 leaves (17 regular + 5 condoned)
• Unnikrishnan R Menon — 15 leaves (12 regular + 3 condoned)
• Niharika Nayan Jha & Kashish Bhutada — 12 each

Most active on the feed:
• Pranav Arora — 81 events
• Mihika Nair — 49 events
• Tanmay Singh — 40 events

Term 4 proved it — when the cohort shows up on the app, attendance chaos becomes manageable. Let’s make Term 5 even louder.

✅ What’s live now:
• Fresh Term 5 TT (from Sep 26)
• Clean leave slate for every subject
• Dashboard / Leave / Timetable / History ready
• Play, News, Cake Radar still there

Open it → mark leaves on time → check TT before you bunk → keep the streak going.

https://msm-control-center.vercel.app

See you in G2 — and on the dashboard.
— Ram’s bot · MSM Control Center · Term 5`;
