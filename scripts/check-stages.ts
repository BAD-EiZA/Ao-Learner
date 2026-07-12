import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const p = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const n = await p.stage.count();
  const s = await p.stage.findMany({
    orderBy: [{ language: "asc" }, { order: "asc" }],
    select: {
      language: true,
      order: true,
      expectedText: true,
      referenceAudio: true,
    },
  });
  console.log("count", n);
  console.log(JSON.stringify(s, null, 2));
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
