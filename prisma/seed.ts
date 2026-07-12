import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const ENGLISH = [
  {
    order: 1,
    title: "Hello",
    description: "Sapaan sopan kepada seseorang.",
    expectedText: "Hello",
    meaningId: "Halo / Hai",
  },
  {
    order: 2,
    title: "How are you?",
    description: "Menanyakan kabar seseorang.",
    expectedText: "How are you?",
    meaningId: "Apa kabar?",
  },
  {
    order: 3,
    title: "Nice to meet you",
    description: "Mengucapkan senang berkenalan.",
    expectedText: "Nice to meet you",
    meaningId: "Senang bertemu denganmu",
  },
  {
    order: 4,
    title: "Thank you",
    description: "Mengungkapkan rasa terima kasih.",
    expectedText: "Thank you",
    meaningId: "Terima kasih",
  },
  {
    order: 5,
    title: "Good morning",
    description: "Sapaan di pagi hari.",
    expectedText: "Good morning",
    meaningId: "Selamat pagi",
  },
] as const;

const GERMAN = [
  {
    order: 1,
    title: "Guten Morgen",
    description: "Sapaan di pagi hari (bahasa Jerman).",
    expectedText: "Guten Morgen",
    meaningId: "Selamat pagi",
  },
  {
    order: 2,
    title: "Wie geht's?",
    description: "Menanyakan kabar (bahasa Jerman).",
    expectedText: "Wie geht's?",
    meaningId: "Apa kabar?",
  },
  {
    order: 3,
    title: "Freut mich",
    description: "Senang berkenalan (bahasa Jerman).",
    expectedText: "Freut mich",
    meaningId: "Senang bertemu / Senang berkenalan",
  },
  {
    order: 4,
    title: "Danke",
    description: "Ucapan terima kasih (bahasa Jerman).",
    expectedText: "Danke",
    meaningId: "Terima kasih",
  },
  {
    order: 5,
    title: "Auf Wiedersehen",
    description: "Ucapan perpisahan (bahasa Jerman).",
    expectedText: "Auf Wiedersehen",
    meaningId: "Sampai jumpa / Selamat tinggal",
  },
] as const;

const PLACEHOLDER_AUDIO = "/audio/placeholder.mp3";

async function upsertStages(
  language: "ENGLISH" | "GERMAN",
  rows: readonly {
    order: number;
    title: string;
    description: string;
    expectedText: string;
    meaningId: string;
  }[]
) {
  for (const row of rows) {
    await prisma.stage.upsert({
      where: {
        language_order: { language, order: row.order },
      },
      create: {
        language,
        order: row.order,
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
        referenceAudio: PLACEHOLDER_AUDIO,
      },
      update: {
        title: row.title,
        description: row.description,
        expectedText: row.expectedText,
        meaningId: row.meaningId,
      },
    });
  }
}

async function main() {
  await upsertStages("ENGLISH", ENGLISH);
  await upsertStages("GERMAN", GERMAN);
  console.log("Seeded 5 ENGLISH + 5 GERMAN stages (dengan arti Indonesia).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
