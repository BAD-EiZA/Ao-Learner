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
      expectedText: "I think we should leave earlier tomorrow",
      meaningId: "Menurut saya kita harus berangkat lebih awal besok",
      cefr: "B1",
    },
    {
      expectedText: "Although it was difficult, I managed to finish on time",
      meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
      cefr: "B2",
    },
    {
      expectedText:
        "I'd argue that clear communication is essential in any workplace",
      meaningId:
        "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
      cefr: "C1",
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
      expectedText: "Ich denke, wir sollten morgen früher gehen",
      meaningId: "Menurut saya kita harus berangkat lebih awal besok",
      cefr: "B1",
    },
    {
      expectedText:
        "Obwohl es schwierig war, habe ich es rechtzeitig geschafft",
      meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
      cefr: "B2",
    },
    {
      expectedText:
        "Ich würde behaupten, dass klare Kommunikation am Arbeitsplatz entscheidend ist",
      meaningId:
        "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
      cefr: "C1",
    },
  ],
  FRENCH: [
    { expectedText: "Bonjour", meaningId: "Selamat siang / Halo", cefr: "A1" },
    {
      expectedText: "Je m'appelle Alex",
      meaningId: "Nama saya Alex",
      cefr: "A1",
    },
    {
      expectedText: "Où sont les toilettes ?",
      meaningId: "Di mana toilet?",
      cefr: "A2",
    },
    {
      expectedText: "Un café, s'il vous plaît",
      meaningId: "Satu kopi, tolong",
      cefr: "A2",
    },
    {
      expectedText: "Je pense que nous devrions partir plus tôt demain",
      meaningId: "Menurut saya kita harus berangkat lebih awal besok",
      cefr: "B1",
    },
    {
      expectedText:
        "Bien que ce fût difficile, j'ai réussi à finir à temps",
      meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
      cefr: "B2",
    },
    {
      expectedText:
        "Je dirais qu'une communication claire est essentielle au travail",
      meaningId:
        "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
      cefr: "C1",
    },
  ],
  SPANISH: [
    { expectedText: "Hola", meaningId: "Halo", cefr: "A1" },
    {
      expectedText: "Me llamo Alex",
      meaningId: "Nama saya Alex",
      cefr: "A1",
    },
    {
      expectedText: "¿Dónde está el baño?",
      meaningId: "Di mana kamar mandi?",
      cefr: "A2",
    },
    {
      expectedText: "Un café, por favor",
      meaningId: "Satu kopi, tolong",
      cefr: "A2",
    },
    {
      expectedText: "Creo que deberíamos salir más temprano mañana",
      meaningId: "Menurut saya kita harus berangkat lebih awal besok",
      cefr: "B1",
    },
    {
      expectedText: "Aunque fue difícil, logré terminar a tiempo",
      meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
      cefr: "B2",
    },
    {
      expectedText:
        "Diría que una comunicación clara es esencial en el trabajo",
      meaningId:
        "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
      cefr: "C1",
    },
  ],
  ITALIAN: [
    { expectedText: "Ciao", meaningId: "Halo", cefr: "A1" },
    {
      expectedText: "Mi chiamo Alex",
      meaningId: "Nama saya Alex",
      cefr: "A1",
    },
    {
      expectedText: "Dov'è il bagno?",
      meaningId: "Di mana kamar mandi?",
      cefr: "A2",
    },
    {
      expectedText: "Un caffè, per favore",
      meaningId: "Satu kopi, tolong",
      cefr: "A2",
    },
    {
      expectedText: "Penso che dovremmo partire prima domani",
      meaningId: "Menurut saya kita harus berangkat lebih awal besok",
      cefr: "B1",
    },
    {
      expectedText: "Anche se è stato difficile, sono riuscito a finire in tempo",
      meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
      cefr: "B2",
    },
    {
      expectedText:
        "Direi che una comunicazione chiara è essenziale sul lavoro",
      meaningId:
        "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
      cefr: "C1",
    },
  ],
  PORTUGUESE: [
    { expectedText: "Olá", meaningId: "Halo", cefr: "A1" },
    {
      expectedText: "Meu nome é Alex",
      meaningId: "Nama saya Alex",
      cefr: "A1",
    },
    {
      expectedText: "Onde fica o banheiro?",
      meaningId: "Di mana kamar mandi?",
      cefr: "A2",
    },
    {
      expectedText: "Um café, por favor",
      meaningId: "Satu kopi, tolong",
      cefr: "A2",
    },
    {
      expectedText: "Acho que deveríamos sair mais cedo amanhã",
      meaningId: "Menurut saya kita harus berangkat lebih awal besok",
      cefr: "B1",
    },
    {
      expectedText: "Embora tenha sido difícil, consegui terminar a tempo",
      meaningId: "Meski sulit, saya berhasil selesai tepat waktu",
      cefr: "B2",
    },
    {
      expectedText:
        "Eu diria que uma comunicação clara é essencial no trabalho",
      meaningId:
        "Saya berpendapat komunikasi yang jelas penting di tempat kerja",
      cefr: "C1",
    },
  ],
};

export function computePlacementLevel(scores: number[]): CefrLevel {
  if (scores.length === 0) return "A1";
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const last = scores.slice(-3);
  const strongTail =
    last.length >= 2 && last.every((s) => s >= 72) && avg >= 74;
  if (avg >= 90 && strongTail) return "C1";
  if (avg >= 84 && strongTail) return "B2";
  if (avg >= 78 || (strongTail && avg >= 76)) return "B1";
  if (avg >= 65 || strongTail) return "A2";
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
    const { unlockAchievement } = await import(
      "@/lib/learning/achievements"
    );
    await unlockAchievement(userId, "placement_done");
  } catch {
    /* ignore */
  }

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
  const ranks: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
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
