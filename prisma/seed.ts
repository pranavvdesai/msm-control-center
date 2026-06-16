import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const subjects = [
  { name: "B2B Marketing", code: "MSM6400", credits: 3, faculty: "Prof. Prashant Yatgiri" },
  { name: "Applied Marketing Strategy", code: "MSM6430", credits: 3, faculty: "Prof. R C Natarajan" },
  { name: "Services Marketing", code: "MSM6407", credits: 3, faculty: "Prof. Sooraj Namboodri" },
  { name: "Supply Chain Management", code: "MSM6503", credits: 2, faculty: "Prof. Varun Sharma" },
  { name: "Management of Sales Force (Elective)", code: "MSM6404", credits: 2, faculty: "Prof. Jeevan J Arakal" },
  { name: "Legal Aspects of Business", code: "MSM6904", credits: 2, faculty: "Prof. Sudeep Kumar" },
  { name: "Internship Viva Voce", code: "INTERN", credits: 1, faculty: "Faculty Panel" },
];

async function main() {
  await prisma.activityEvent.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSettings.deleteMany();

  const passwordHash = await bcrypt.hash("msm2026", 10);

  const students = [
    { name: "Arjun Mehta", email: "arjun@msm.cohort" },
    { name: "Priya Sharma", email: "priya@msm.cohort" },
    { name: "Rahul Verma", email: "rahul@msm.cohort" },
    { name: "Sneha Kapoor", email: "sneha@msm.cohort" },
    { name: "Raam", email: "raam@msm.cohort", role: "ADMIN" as const },
  ];

  for (const student of students) {
    await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        passwordHash,
        role: student.role ?? "STUDENT",
      },
    });
  }

  for (const subject of subjects) {
    await prisma.subject.create({ data: subject });
  }

  await prisma.appSettings.create({
    data: {
      crName: "Raam",
      cohortName: "MSM",
      cohortFull: "Marketing and Sales Management",
      termInfo: "Term 4 · June 15 – Sep 23, 2026 · TAPMI Manipal",
    },
  });

  await prisma.activityEvent.createMany({
    data: [
      {
        message:
          "Arjun has already taken 2 leaves in B2B Marketing. Please tell him academics still exist.",
        type: "social",
      },
      {
        message: "Priya marked a condoned leave today. Looks like life happened.",
        type: "social",
      },
      {
        message: "5 students missed today's lecture. Faculty suspicion level rising.",
        type: "social",
      },
      {
        message:
          "Your friend Rahul currently attends more classes than you. This is concerning.",
        type: "social",
      },
      {
        message: "All is well. Attendance under control for most of MSM.",
        type: "meme",
      },
      {
        message: "MSM Control Center is live. Developed by Raam — Naam toh suna hoga !!",
        type: "system",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin login: raam@msm.cohort / msm2026");
  console.log("Upload TERM 4 MBA-MKT TT.xlsx from Admin → Upload TT");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
