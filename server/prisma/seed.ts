import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("test@123", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@teamsync.com" },
    update: {},
    create: {
      name: "abc",
      email: "demo@teamsync.com",
      passwordHash,
    },
  });

  console.log(`Demo user ready: ${demo.email} (id: ${demo.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
