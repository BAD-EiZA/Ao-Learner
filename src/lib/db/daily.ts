import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";

/** Deterministic daily stage pick from date */
export function pickDailyStageIndex(dateKey: string, count: number) {
  if (count <= 0) return 0;
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return h % count;
}

/** Adaptive daily: prefer stages in sweet-spot scores, else deterministic */
export async function getDailyChallenge(userId: string) {
  const dateKey = todayKey();
  const stages = await prisma.stage.findMany({
    where: { mode: "PHRASE" },
    orderBy: [{ language: "asc" }, { order: "asc" }],
    include: {
      userProgress: { where: { userId }, take: 1 },
    },
  });
  if (stages.length === 0) return null;

  // sweet spot: not mastered (best < 85) but attempted or mid CEFR
  const sweet = stages.filter((s) => {
    const best = s.userProgress[0]?.bestScore;
    if (best == null) return s.cefrLevel === "A1" || s.cefrLevel === "A2";
    return best >= 45 && best < 85;
  });

  const pool = sweet.length >= 3 ? sweet : stages;
  const idx = pickDailyStageIndex(dateKey + userId.slice(0, 4), pool.length);
  const stage = pool[idx]!;

  const completion = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_dateKey: { userId, dateKey } },
  });

  return {
    dateKey,
    stage: {
      id: stage.id,
      title: stage.title,
      language: stage.language,
      expectedText: stage.expectedText,
      meaningId: stage.meaningId,
      description: stage.description,
      cefrLevel: stage.cefrLevel,
    },
    completed: !!completion,
    score: completion?.score ?? null,
    passed: completion?.passed ?? false,
  };
}

export async function completeDailyChallenge(params: {
  userId: string;
  stageId: string;
  score: number;
  passed: boolean;
}) {
  const dateKey = todayKey();
  const daily = await getDailyChallenge(params.userId);
  if (!daily || daily.stage.id !== params.stageId) {
    return { ok: false as const, reason: "not_today" };
  }

  await prisma.dailyChallengeCompletion.upsert({
    where: { userId_dateKey: { userId: params.userId, dateKey } },
    create: {
      userId: params.userId,
      dateKey,
      stageId: params.stageId,
      score: params.score,
      passed: params.passed,
    },
    update: {
      score: params.score,
      passed: params.passed || undefined,
      stageId: params.stageId,
    },
  });

  return { ok: true as const, dateKey };
}
