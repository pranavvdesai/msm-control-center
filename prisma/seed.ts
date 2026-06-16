import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COHORT_PASSWORD, COHORT_STUDENTS } from "../src/lib/students";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(COHORT_PASSWORD, 10);

  console.log(`Seeding ${COHORT_STUDENTS.length} MSM students...`);

  for (const student of COHORT_STUDENTS) {
    const roll = student.rollNumber.toUpperCase();
    const email = `${roll.toLowerCase()}@msm.cohort`;

    await prisma.user.upsert({
      where: { rollNumber: roll },
      update: {
        name: student.name,
        passwordHash,
        role: student.role ?? "STUDENT",
      },
      create: {
        name: student.name,
        rollNumber: roll,
        email,
        passwordHash,
        role: student.role ?? "STUDENT",
        profileComplete: false,
      },
    });
  }

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { crName: "Raam (25M136)" },
    create: {
      crName: "Raam (25M136)",
      cohortName: "MSM",
      cohortFull: "Marketing and Sales Management",
      termInfo: "Term 4 · June 15 – Sep 23, 2026 · TAPMI Manipal",
    },
  });

  await prisma.activityEvent.create({
    data: {
      message:
        "MSM cohort is LIVE! 58 heroes registered. Login with your roll number. Developed by Raam — Naam toh suna hoga !!",
      type: "system",
    },
  });

  console.log("Seed complete!");
  console.log(`Login: Roll number (e.g. 25M101) / Password: ${COHORT_PASSWORD}`);
  console.log("Admin CR: 25M136 (Ram J Pareek)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
