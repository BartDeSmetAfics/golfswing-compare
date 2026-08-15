import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const pros = [
  { name: "Bryson DeChambeau", slug: "bryson-dechambeau" },
  { name: "Grant Horvat", slug: "grant-horvat" },
  { name: "TheBryanBros", slug: "the-bryan-bros" },
];

async function main() {
  for (const pro of pros) {
    await prisma.pro.upsert({
      where: { slug: pro.slug },
      update: {},
      create: pro,
    });
  }
  console.log(`Seeded ${pros.length} pros`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
