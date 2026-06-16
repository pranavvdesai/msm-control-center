import { prisma } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";

export async function sendWelcomeEmailIfNeeded(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      rollNumber: true,
      collegeEmail: true,
      welcomeEmailSent: true,
    },
  });

  if (!user?.collegeEmail || user.welcomeEmailSent) {
    return { sent: 0, skipped: true };
  }

  const result = await sendWelcomeEmail({
    name: user.name,
    rollNumber: user.rollNumber,
    collegeEmail: user.collegeEmail,
  });

  if (result.sent > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { welcomeEmailSent: true },
    });
  }

  return result;
}
