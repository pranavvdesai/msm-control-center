const APP_URL = process.env.APP_URL ?? "https://msm-control-center.vercel.app";
const ROLL = process.env.RESTORE_ROLL ?? "25M136";
const PASSWORD = process.env.RESTORE_PASSWORD ?? "MSM@2027";

async function main() {
  const loginRes = await fetch(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rollNumber: ROLL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok) throw new Error(loginBody.error || "Login failed");
  const cookie = loginRes.headers.get("set-cookie");
  if (!cookie) throw new Error("No session cookie");
  const sessionCookie = cookie.split(";")[0];

  async function get(qs: string) {
    const r = await fetch(`${APP_URL}/api/timetable?${qs}`, {
      headers: { Cookie: sessionCookie },
    });
    return r.json();
  }

  const [today, tomorrow, july] = await Promise.all([
    get("date=2026-07-21"),
    get("date=2026-07-22"),
    get("month=2026-07"),
  ]);

  type E = { id: string; date: string; startTime: string; sessionNumber?: number | null; subject: { name: string } };
  const julyEntries: E[] = july.entries ?? [];
  const around = julyEntries.filter((e) => e.date.slice(0, 10) >= "2026-07-19" && e.date.slice(0, 10) <= "2026-07-24");

  console.log(
    JSON.stringify(
      {
        todayCount: today.entries?.length ?? 0,
        tomorrowCount: tomorrow.entries?.length ?? 0,
        julyCount: julyEntries.length,
        julyDatesAroundNow: around.map((e) => ({
          rawDate: e.date,
          startTime: e.startTime,
          subject: e.subject.name,
          sessionNumber: e.sessionNumber,
        })),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
