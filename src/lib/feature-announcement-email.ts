export const FEATURE_ANNOUNCEMENT_SUBJECT =
  "Play + News are live — Sudoku, Quiz, leaderboards & daily headlines 📰🎮";

export function featureAnnouncementEmailHtml(firstName: string, appUrl: string) {
  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 580px; margin: 0 auto; background: #030014; color: #f4f4f5; padding: 32px 28px; border-radius: 16px;">
      <p style="color: #22d3ee; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; text-align: center; margin: 0;">MSM Control Center</p>

      <p style="color: #fde68a; font-size: 15px; line-height: 1.7; margin: 20px 0 8px; text-align: center; font-weight: 600;">
        Hello namaste from Ram&apos;s personal bot assistant — this is an automated mail!!
      </p>

      <h1 style="font-size: 24px; margin: 12px 0 16px; text-align: center; line-height: 1.3;">
        Hey ${firstName} — two big upgrades just dropped 👇
      </h1>

      <p style="color: #d4d4d8; line-height: 1.75; font-size: 16px; margin: 0 0 8px;">
        Your MSM Control Center isn&apos;t just attendance anymore. We&apos;ve added a
        <strong style="color: #fff;">Play</strong> tab and a <strong style="color: #fff;">News</strong> tab —
        built so you stay sharp, stay competitive, and stay informed. The kind of habits
        that separate good managers from great ones start <em>now</em>, not after placement.
      </p>

      <div style="margin: 28px 0; padding: 20px; background: #0a0a1a; border-radius: 14px; border: 1px solid #8b5cf655;">
        <p style="margin: 0 0 10px; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">🎮 Play tab — compete with your cohort</p>
        <p style="margin: 0; color: #d4d4d8; line-height: 1.85; font-size: 15px;">
          Open <strong style="color: white;">Play</strong> and you&apos;ll find:
        </p>
        <ul style="color: #d4d4d8; line-height: 1.85; font-size: 15px; padding-left: 20px; margin: 12px 0;">
          <li><strong style="color: #fff;">Daily Sudoku</strong> — expert-level grid, race the clock, same puzzle for the whole batch every day</li>
          <li><strong style="color: #fff;">Daily Quiz</strong> — 5 tough questions on geopolitics, Indian history, business, sports &amp; pop culture</li>
          <li><strong style="color: #fff;">Leaderboards</strong> — today&apos;s board + all-time rankings. Bragging rights included.</li>
        </ul>
        <p style="margin: 12px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.7;">
          Everything resets at midnight IST. One Sudoku. One Quiz. One chance to climb the board before your friends do.
        </p>
        <a href="${appUrl}/games" style="display: inline-block; margin-top: 16px; padding: 12px 22px; background: linear-gradient(135deg, #22d3ee, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
          Open Play →
        </a>
      </div>

      <div style="margin: 28px 0; padding: 20px; background: #0a0a1a; border-radius: 14px; border: 1px solid #f9731655;">
        <p style="margin: 0 0 10px; color: #fb923c; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">📰 News tab — know the world before the case discussion</p>
        <p style="margin: 0; color: #d4d4d8; line-height: 1.85; font-size: 15px;">
          Future managers don&apos;t walk into a room clueless about what&apos;s happening in markets,
          geopolitics, or culture. The new <strong style="color: white;">News</strong> tab gives you
          <strong style="color: #fff;">top 10 headlines</strong> across:
        </p>
        <ul style="color: #d4d4d8; line-height: 1.85; font-size: 15px; padding-left: 20px; margin: 12px 0;">
          <li>Business · India &amp; Global</li>
          <li>Geopolitics</li>
          <li>Sports · India &amp; Global</li>
          <li>Pop Culture · Bollywood &amp; Hollywood</li>
          <li>Tech &amp; AI</li>
        </ul>
        <p style="margin: 12px 0 0; color: #a1a1aa; font-size: 14px; line-height: 1.7;">
          Fresh every day. Skim it over chai in 5 minutes — walk into class sounding like you actually read the news.
          That&apos;s the edge.
        </p>
        <a href="${appUrl}/news" style="display: inline-block; margin-top: 16px; padding: 12px 22px; background: linear-gradient(135deg, #f97316, #ec4899); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px;">
          Open News →
        </a>
      </div>

      <div style="margin: 28px 0; padding: 18px; background: #18181b; border-radius: 12px; border: 1px solid #3f3f46; text-align: center;">
        <p style="margin: 0 0 14px; color: #fafafa; font-size: 16px; font-weight: 600; line-height: 1.5;">
          Attendance tracking + daily brain workout + world news — all in one place.
        </p>
        <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 28px; background: #fafafa; color: #0f172a; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px;">
          Go to MSM Control Center →
        </a>
      </div>

      <p style="color: #71717a; line-height: 1.7; font-size: 13px; margin: 20px 0 0; text-align: center;">
        Login with your roll number &amp; cohort password, same as always.<br/>
        See you on the leaderboard.
      </p>

      <p style="color: #52525b; font-size: 11px; margin-top: 28px; text-align: center; line-height: 1.6;">
        Automated message from Ram&apos;s bot · MSM Control Center · TAPMI Manipal · Term 5<br/>
        Built with love for the cohort — Ram &amp; team
      </p>
    </div>
  `;
}
