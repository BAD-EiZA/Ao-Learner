import "dotenv/config";
import dns from "node:dns";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { dbConnectionString } from "../src/lib/db/prisma";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: dbConnectionString(),
  ssl: { rejectUnauthorized: false },
});
const p = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const users = await p.user.findMany({
    take: 20,
    include: { stats: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(
    JSON.stringify(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        placementDone: u.stats?.placementDone ?? false,
        level: u.stats?.placementCefr ?? null,
        xp: u.stats?.xp ?? 0,
        hearts: u.stats?.hearts ?? null,
      })),
      null,
      2
    )
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await p.$disconnect();
    await pool.end();
  });
