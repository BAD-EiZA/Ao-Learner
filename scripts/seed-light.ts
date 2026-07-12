/**
 * Lightweight seed with retries — for flaky Neon free tier.
 * Usage: npx tsx scripts/seed-light.ts
 */
import "dotenv/config";
import dns from "node:dns";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { dbConnectionString } from "../src/lib/db/prisma";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: dbConnectionString(),
  max: 1,
  connectionTimeoutMillis: 30_000,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 4) {
  let last: unknown;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`  retry ${i}/${tries} ${label}: ${msg.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw last;
}

async function main() {
  console.log("ping…");
  await withRetry(
    () => prisma.$queryRaw`SELECT 1 as ok`,
    "ping"
  );
  console.log("connected");

  const n = await withRetry(() => prisma.stage.count(), "count");
  console.log("stages:", n);

  // ensure dialogue stages
  for (const row of [
    {
      language: "ENGLISH" as const,
      order: 6,
      title: "Mini chat",
      description: "Short 3-turn conversation.",
      expectedText: "Hello",
      meaningId: "Dialog: Hello → How are you? → Thank you",
      turns: [
        {
          prompt: "Ao says hi. Greet back:",
          expectedText: "Hello",
          meaningId: "Halo",
        },
        {
          prompt: "Ask how they are:",
          expectedText: "How are you?",
          meaningId: "Apa kabar?",
        },
        {
          prompt: "Say thanks:",
          expectedText: "Thank you",
          meaningId: "Terima kasih",
        },
      ],
    },
    {
      language: "GERMAN" as const,
      order: 6,
      title: "Mini-Dialog",
      description: "Short 3-turn conversation (German).",
      expectedText: "Guten Morgen",
      meaningId: "Dialog: Selamat pagi → Apa kabar? → Terima kasih",
      turns: [
        {
          prompt: "Ao greets you. Reply:",
          expectedText: "Guten Morgen",
          meaningId: "Selamat pagi",
        },
        {
          prompt: "Ask how they are:",
          expectedText: "Wie geht's?",
          meaningId: "Apa kabar?",
        },
        {
          prompt: "Say thanks:",
          expectedText: "Danke",
          meaningId: "Terima kasih",
        },
      ],
    },
  ]) {
    await withRetry(async () => {
      await prisma.stage.upsert({
        where: {
          language_order: { language: row.language, order: row.order },
        },
        create: {
          language: row.language,
          order: row.order,
          title: row.title,
          description: row.description,
          expectedText: row.expectedText,
          meaningId: row.meaningId,
          referenceAudio: "/audio/placeholder.mp3",
          mode: "DIALOGUE",
          turns: row.turns as unknown as Prisma.InputJsonValue,
        },
        update: {
          title: row.title,
          description: row.description,
          mode: "DIALOGUE",
          turns: row.turns as unknown as Prisma.InputJsonValue,
          meaningId: row.meaningId,
        },
      });
      console.log("upsert", row.language, row.order);
    }, `upsert ${row.language}#${row.order}`);
  }

  console.log("done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
