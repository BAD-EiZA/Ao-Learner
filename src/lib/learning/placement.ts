import { prisma } from "@/lib/db/prisma";
import type { CefrLevel, Language } from "@/generated/prisma/client";

/** Fixed placement items per language (short speaking samples) */
export const PLACEMENT_PROMPTS: Record<
  Language,
  { expectedText: string; meaningId: string; cefr: CefrLevel }[]
> = {
  ENGLISH: [
    { expectedText: "Hello", meaningId: "Halo", cefr: "A1" },
    { expectedText: "My name is Alex", meaningId: "Nama saya Alex", cefr: "A1" },
    {
      expectedText: "Where is the bathroom?",
      meaningId: "Di mana kamar mandi?",
      cefr: "A2",
    },
    {
      expectedText: "I'd like a coffee, please",
      meaningId: "Saya mau kopi, tolong",
      cefr: "A2",
    },
    {
      expectedText: "Could you repeat that?",
      meaningId: "Bisa ulangi lagi?",
      cefr: "A2",
    },
  ],
  GERMAN: [
    { expectedText: "Guten Tag", meaningId: "Selamat siang", cefr: "A1" },
    { expectedText: "Ich heiße Anna", meaningId: "Nama saya Anna", cefr: "A1" },
    {
      expectedText: "Wo ist die Toilette?",
      meaningId: "Di mana toilet?",
      cefr: "A2",
    },
    {
      expectedText: "Einen Kaffee, bitte",
      meaningId: "Satu kopi, tolong",
      cefr: "A2",
    },
    {
      expectedText: "Können Sie das wiederholen?",
      meaningId: "Bisa ulangi lagi?",
      cefr: "A2",
    },
  ],
};

export function computePlacementLevel(
  scores: number[]
): CefrLevel {
  if (scores.length === 0) return "A1";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const lastTwo = scores.slice(-2);
  const strongA2 =
    lastTwo.length === 2 && lastTwo.every((s) => s >= 70) && avg >= 72;
  if (strongA2 && avg >= 80) return "B1";
  if (avg >= 65 || strongA2) return "A2";
  return "A1";
}

export async function savePlacement(
  userId: string,
  level: CefrLevel,
  language: Language
) {
  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      placementDone: true,
      placementCefr: level,
      currentStreak: 0,
      longestStreak: 0,
    },
    update: {
      placementDone: true,
      placementCefr: level,
    },
  });

  try {
    const { trackServer } = await import("@/lib/analytics-server");
    await trackServer("placement_complete", {
      userId,
      props: { level, language },
    });
  } catch {
    /* ignore */
  }

  // Unlock stages up to recommended CEFR by marking prior levels complete-lite
  // Actually: set progress unlocked by completing all stages below placement
  const ranks: CefrLevel[] = ["A1", "A2", "B1"];
  const target = ranks.indexOf(level);
  if (target <= 0) return { level };

  const lower = ranks.slice(0, target);
  const stages = await prisma.stage.findMany({
    where: { language, cefrLevel: { in: lower } },
    select: { id: true },
  });

  for (const s of stages) {
    await prisma.userProgress.upsert({
      where: { userId_stageId: { userId, stageId: s.id } },
      create: {
        userId,
        stageId: s.id,
        isCompleted: true,
        attemptsCount: 0,
        bestScore: 70,
      },
      update: {
        isCompleted: true,
      },
    });
  }

  return { level, unlockedBelow: lower };
}

export async function getPlacementStatus(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  return {
    done: stats?.placementDone ?? false,
    level: stats?.placementCefr ?? null,
  };
}
