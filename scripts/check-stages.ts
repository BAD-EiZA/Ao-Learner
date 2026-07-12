import "dotenv/config";
import dns from "node:dns";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { dbConnectionString } from "../src/lib/db/prisma";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: dbConnectionString(),
  connectionTimeoutMillis: 30_000,
  ssl: { rejectUnauthorized: false },
});
const p = new PrismaClient({
  adapter: new PrismaPg(pool),
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
  .finally(async () => {
    await p.$disconnect();
    await pool.end();
  });
