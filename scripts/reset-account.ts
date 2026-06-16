import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COHORT_PASSWORD } from "../src/lib/students";

const rollNumber = (process.argv[2] || "25M136").toUpperCase();

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { rollNumber } });
  if (!user) {
    console.error("User not found:", rollNumber);
    process.exit(1);
  }

  await prisma.leave.deleteMany({ where: { userId: user.id } });
  await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  const passwordHash = await bcrypt.hash(COHORT_PASSWORD, 10);
  const fresh = await prisma.user.create({
    data: {
      name: user.name,
      rollNumber: user.rollNumber,
      email: `${rollNumber.toLowerCase()}@msm.cohort`,
      passwordHash,
      role: user.role,
      profileComplete: false,
      welcomeEmailSent: false,
    },
  });

  console.log("Account reset for", rollNumber, "→ new id:", fresh.id);
  console.log("Login with", rollNumber, "/", COHORT_PASSWORD, "then complete onboarding.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
