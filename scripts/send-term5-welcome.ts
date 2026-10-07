import { PrismaClient } from "@prisma/client";
import { sendEmail, isEmailConfigured } from "../src/lib/email";
import {
  TERM5_WELCOME_SUBJECT,
  TERM5_WELCOME_WHATSAPP,
  term5WelcomeEmailHtml,
} from "../src/lib/term5-welcome-email";

const prisma = new PrismaClient();

const mode = process.argv.includes("--all")
  ? "all"
  : process.argv.includes("--whatsapp")
    ? "whatsapp"
    : "test";

async function main() {
  if (mode === "whatsapp") {
    console.log(TERM5_WELCOME_WHATSAPP);
    return;
  }

  if (!isEmailConfigured()) {
    console.error("Email not configured (msm.tapmi@gmail.com Gmail app password).");
    console.log("\n--- WhatsApp copy instead ---\n");
    console.log(TERM5_WELCOME_WHATSAPP);
    process.exit(1);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://msm-control-center.vercel.app";
  const subjectPrefix = mode === "test" ? "[PREVIEW — Ram only] " : "";

  if (mode === "test") {
    const user = await prisma.user.findUnique({
      where: { rollNumber: "25M136" },
      select: { name: true, collegeEmail: true, email: true },
    });
    if (!user) throw new Error("Ram (25M136) not found");
    const to = user.collegeEmail || user.email;
    if (!to) throw new Error("No email for Ram");
    const html = term5WelcomeEmailHtml(user.name.split(" ")[0], appUrl);
    const ok = await sendEmail(to, `${subjectPrefix}${TERM5_WELCOME_SUBJECT}`, html);
    if (!ok) throw new Error(`Failed to send preview to ${to}`);
    console.log(`Preview sent to ${to}`);
    return;
  }

  const users = await prisma.user.findMany({
    where: { profileComplete: true, collegeEmail: { not: null } },
    select: { name: true, collegeEmail: true, rollNumber: true },
    orderBy: { rollNumber: "asc" },
  });

  let sent = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const user of users) {
    const html = term5WelcomeEmailHtml(user.name.split(" ")[0], appUrl);
    const ok = await sendEmail(user.collegeEmail!, TERM5_WELCOME_SUBJECT, html);
    if (ok) sent++;
    else {
      failed++;
      failures.push(user.rollNumber);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`Done. Sent: ${sent}, failed: ${failed}, total: ${users.length}`);
  if (failures.length) console.log("Failed rolls:", failures.join(", "));
  process.exit(failed === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
