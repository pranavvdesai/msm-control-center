/**
 * Calls production term-rollover after the new API is deployed.
 * Usage: npx tsx scripts/run-term-rollover.ts
 */
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

  const res = await fetch(`${APP_URL}/api/admin/term-rollover`, {
    method: "POST",
    headers: {
      Cookie: sessionCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      termInfo: "Term 5 · Sep 26, 2026 onwards · TAPMI Manipal",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
