import "dotenv/config";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const n = await prisma.stage.count();
  console.log("stage count", n);

  // update dialogue stages only if missing
  const enDialog = await prisma.stage.findFirst({
    where: { language: "ENGLISH", order: 6 },
  });
  if (!enDialog) {
    await prisma.stage.create({
      data: {
        language: "ENGLISH",
        order: 6,
        title: "Mini chat",
        description: "Short 3-turn conversation.",
        expectedText: "Hello",
        meaningId: "Dialog: Hello → How are you? → Thank you",
        referenceAudio: "/audio/placeholder.mp3",
        mode: "DIALOGUE",
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
        ] as unknown as Prisma.InputJsonValue,
      },
    });
    console.log("created EN dialogue");
  } else {
    console.log("EN dialogue exists", enDialog.id);
  }

  const deDialog = await prisma.stage.findFirst({
    where: { language: "GERMAN", order: 6 },
  });
  if (!deDialog) {
    await prisma.stage.create({
      data: {
        language: "GERMAN",
        order: 6,
        title: "Mini-Dialog",
        description: "Short 3-turn conversation (German).",
        expectedText: "Guten Morgen",
        meaningId: "Dialog: Selamat pagi → Apa kabar? → Terima kasih",
        referenceAudio: "/audio/placeholder.mp3",
        mode: "DIALOGUE",
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
        ] as unknown as Prisma.InputJsonValue,
      },
    });
    console.log("created DE dialogue");
  } else {
    console.log("DE dialogue exists", deDialog.id);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
