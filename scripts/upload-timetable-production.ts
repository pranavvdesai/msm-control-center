import fs from "fs";
import path from "path";

const APP_URL = process.env.APP_URL ?? "https://msm-control-center.vercel.app";
const ROLL = process.env.RESTORE_ROLL ?? "25M136";
const PASSWORD = process.env.RESTORE_PASSWORD ?? "MSM@2027";
const FILE = process.argv[2];

if (!FILE) {
  console.error("Usage: tsx scripts/upload-timetable-production.ts <xlsx-path>");
  process.exit(1);
}

async function main() {
  const loginRes = await fetch(`${APP_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rollNumber: ROLL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json();
  if (!loginRes.ok) throw new Error(loginBody.error || "Login failed");

  const cookie = loginRes.headers.get("set-cookie");
  if (!cookie) throw new Error("No session cookie returned from login");

  const sessionCookie = cookie.split(";")[0];

  const filePath = path.resolve(FILE);
  const buffer = fs.readFileSync(filePath);
  const form = new FormData();
  form.append("file", new Blob([buffer]), path.basename(filePath));

  const uploadRes = await fetch(`${APP_URL}/api/timetable/upload`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
    body: form,
  });
  const uploadBody = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(uploadBody.error || "Upload failed");

  const june = await fetch(`${APP_URL}/api/timetable?month=2026-06`, {
    headers: { Cookie: sessionCookie },
  }).then((r) => r.json());
  const july = await fetch(`${APP_URL}/api/timetable?month=2026-07`, {
    headers: { Cookie: sessionCookie },
  }).then((r) => r.json());

  console.log(
    JSON.stringify(
      {
        upload: uploadBody,
        after: {
          june: june.entries?.length ?? 0,
          july: july.entries?.length ?? 0,
        },
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
