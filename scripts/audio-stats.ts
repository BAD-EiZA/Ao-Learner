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
  const all = await p.stage.findMany({
    select: {
      mode: true,
      referenceAudio: true,
      order: true,
      language: true,
      title: true,
    },
  });
  const remote = all.filter((s) => s.referenceAudio.startsWith("http"));
  const local = all.filter((s) => !s.referenceAudio.startsWith("http"));
  console.log("total", all.length);
  console.log("remote_audio", remote.length);
  console.log("placeholder", local.length);
  for (const m of ["PHRASE", "DIALOGUE", "ROLEPLAY", "STORY"] as const) {
    console.log(m, all.filter((s) => s.mode === m).length);
  }
  console.log(
    "placeholder_stages",
    local.map((s) => `${s.language}#${s.order} ${s.title}`).join(" | ")
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await p.$disconnect();
    await pool.end();
  });
