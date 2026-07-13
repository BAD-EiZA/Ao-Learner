import "dotenv/config";
import dns from "node:dns";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { dbConnectionString } from "../src/lib/db/prisma";
import { savePlacement } from "../src/lib/learning/placement";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: dbConnectionString(),
  ssl: { rejectUnauthorized: false },
});
const p = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const email = process.argv[2] || "erzhaamierra@gmail.com";
  const user = await p.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user ${email}`);
  await savePlacement(user.id, "A1", "ENGLISH");
  const stats = await p.userStats.findUnique({ where: { userId: user.id } });
  console.log("OK", {
    email,
    placementDone: stats?.placementDone,
    level: stats?.placementCefr,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await p.$disconnect();
    await pool.end();
  });
