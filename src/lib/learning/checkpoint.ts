import { prisma } from "@/lib/db/prisma";
import type { Language } from "@/generated/prisma/client";
import { PASS_SCORE } from "@/lib/constants";
import { awardXp } from "@/lib/learning/xp";
import { awardGems } from "@/lib/learning/gems";

/** Unit = group of 5 PHRASE stages by order */
export function unitKeyForOrder(order: number) {
  const unit = Math.ceil(order / 5);
  return `u${unit}`;
}

export async function getCheckpointStatus(
  userId: string,
  language: Language
) {
  const stages = await prisma.stage.findMany({
    where: { language, mode: "PHRASE" },
    orderBy: { order: "asc" },
    include: {
      userProgress: { where: { userId }, take: 1 },
    },
  });

  const units: {
    unitKey: string;
    orders: number[];
    stageIds: string[];
    allDone: boolean;
    checkpointPassed: boolean;
  }[] = [];

  for (let u = 1; u <= 4; u++) {
    const unitKey = `u${u}`;
    const slice = stages.filter(
      (s) => Math.ceil(s.order / 5) === u && s.order <= 18
    );
    if (!slice.length) continue;
    const allDone = slice.every((s) => s.userProgress[0]?.isCompleted);
    const run = await prisma.checkpointRun.findUnique({
      where: {
        userId_language_unitKey: { userId, language, unitKey },
      },
    });
    units.push({
      unitKey,
      orders: slice.map((s) => s.order),
      stageIds: slice.map((s) => s.id),
      allDone,
      checkpointPassed: run?.passed ?? false,
    });
  }

  return units;
}

/** Pick 3 stages from unit for oral checkpoint */
export async function getCheckpointQuiz(
  userId: string,
  language: Language,
  unitKey: string
) {
  const unitNum = Number(unitKey.replace("u", "")) || 1;
  const stages = await prisma.stage.findMany({
    where: {
      language,
      mode: "PHRASE",
      order: { gte: (unitNum - 1) * 5 + 1, lte: unitNum * 5 },
    },
    orderBy: { order: "asc" },
  });
  const pick = stages.slice(0, 3);
  return pick.map((s) => ({
    stageId: s.id,
    expectedText: s.expectedText,
    meaningId: s.meaningId,
    title: s.title,
    referenceAudio: s.referenceAudio,
  }));
}

export async function submitCheckpoint(params: {
  userId: string;
  language: Language;
  unitKey: string;
  scores: number[];
}) {
  const avg = params.scores.length
    ? Math.round(
        params.scores.reduce((a, b) => a + b, 0) / params.scores.length
      )
    : 0;
  const passed = avg >= PASS_SCORE;
  await prisma.checkpointRun.upsert({
    where: {
      userId_language_unitKey: {
        userId: params.userId,
        language: params.language,
        unitKey: params.unitKey,
      },
    },
    create: {
      userId: params.userId,
      language: params.language,
      unitKey: params.unitKey,
      scoreAvg: avg,
      passed,
    },
    update: { scoreAvg: avg, passed },
  });
  if (passed) {
    await awardXp(params.userId, 50);
    await awardGems(params.userId, 20);
  }
  return { avg, passed };
}
