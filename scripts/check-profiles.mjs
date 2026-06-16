const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.user
  .findMany({
    where: { profileComplete: true },
    select: { name: true, rollNumber: true, collegeEmail: true, profileComplete: true },
    take: 5,
  })
  .then((u) => {
    console.log(JSON.stringify(u, null, 2));
    return p.$disconnect();
  });
