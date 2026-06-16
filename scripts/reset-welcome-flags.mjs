import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
await p.user.updateMany({ data: { welcomeEmailSent: false } });
console.log("Reset welcomeEmailSent for all users");
await p.$disconnect();
