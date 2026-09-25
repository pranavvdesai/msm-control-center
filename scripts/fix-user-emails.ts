import { PrismaClient } from "@prisma/client";
import { sendWelcomeEmail } from "../src/lib/email";

const prisma = new PrismaClient();

const FIXES: Array<{ rollNumber: string; collegeEmail: string }> = [
  { rollNumber: "25M154", collegeEmail: "yaushnika.tapmimpl2025@learner.manipal.edu" },
  { rollNumber: "25M150", collegeEmail: "unnikrishnan.tapmimpl2025@learner.manipal.edu" },
];

async function main() {
  for (const { rollNumber, collegeEmail } of FIXES) {
    const roll = rollNumber.toUpperCase();
    const email = collegeEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { rollNumber: roll },
      select: { id: true, name: true, rollNumber: true, collegeEmail: true, welcomeEmailSent: true },
    });

    if (!user) {
      console.error(`User not found: ${roll}`);
      continue;
    }

    console.log(`\n${user.name} (${roll})`);
    console.log(`  Old email: ${user.collegeEmail ?? "(none)"}`);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        collegeEmail: email,
        profileComplete: true,
        welcomeEmailSent: false,
      },
    });

    console.log(`  New email: ${email}`);

    const result = await sendWelcomeEmail({
      name: user.name,
      rollNumber: user.rollNumber,
      collegeEmail: email,
    });

    if (result.sent > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { welcomeEmailSent: true },
      });
      console.log(`  Welcome email sent to ${email}`);
    } else {
      console.error(`  Welcome email FAILED (check Gmail/Resend env)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
