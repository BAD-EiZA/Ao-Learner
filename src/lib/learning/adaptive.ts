import { prisma } from "@/lib/db/prisma";
import { PASS_SCORE } from "@/lib/constants";
import type { CefrLevel, Language } from "@/generated/prisma/client";

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1"];

export function cefrRank(level: CefrLevel | string) {
  return Math.max(0, CEFR_ORDER.indexOf(level as CefrLevel));
}

/** Adaptive pass threshold: base + boost + CEFR bump (+ hard mode) */
export async function getAdaptivePassThreshold(
  userId: string,
  cefrLevel?: CefrLevel | string,
  hardMode = false
) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  const boost = stats?.passBoost ?? 0;
  const cefrBump =
    cefrLevel === "B1" ? 8 : cefrLevel === "A2" ? 4 : 0;
  const hardBump = hardMode ? 10 : 0;
  return Math.min(90, Math.max(50, PASS_SCORE + boost + cefrBump + hardBump));
}

/** After consecutive strong passes, raise difficulty slightly */
export async function updateDifficultyBoost(
  userId: string,
  score: number,
  passed: boolean
) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return;

  let consecutivePasses = stats.consecutivePasses;
  let passBoost = stats.passBoost;

  if (passed && score >= 85) {
    consecutivePasses += 1;
    if (consecutivePasses >= 3 && passBoost < 10) {
      passBoost += 2;
      consecutivePasses = 0;
    }
  } else if (!passed) {
    consecutivePasses = 0;
    if (passBoost > 0) passBoost = Math.max(0, passBoost - 1);
  }

  await prisma.userStats.update({
    where: { userId },
    data: { consecutivePasses, passBoost },
  });
}

export type WeakSpot = {
  stageId: string;
  title: string;
  expectedText: string;
  meaningId: string;
  language: Language;
  cefrLevel: CefrLevel;
  failCount: number;
  avgScore: number;
  bestScore: number | null;
};

/** Stages with repeated low scores */
export async function getWeakSpots(
  userId: string,
  limit = 6
): Promise<WeakSpot[]> {
  const attempts = await prisma.attemptHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      stage: {
        select: {
          id: true,
          title: true,
          expectedText: true,
          meaningId: true,
          language: true,
          cefrLevel: true,
        },
      },
    },
  });

  const map = new Map<
    string,
    {
      stage: WeakSpot;
      scores: number[];
      fails: number;
    }
  >();

  for (const a of attempts) {
    const id = a.stageId;
    let row = map.get(id);
    if (!row) {
      row = {
        stage: {
          stageId: a.stage.id,
          title: a.stage.title,
          expectedText: a.stage.expectedText,
          meaningId: a.stage.meaningId,
          language: a.stage.language,
          cefrLevel: a.stage.cefrLevel,
          failCount: 0,
          avgScore: 0,
          bestScore: null,
        },
        scores: [],
        fails: 0,
      };
      map.set(id, row);
    }
    row.scores.push(a.score);
    if (!a.passed) row.fails += 1;
  }

  const progress = await prisma.userProgress.findMany({
    where: { userId },
    select: { stageId: true, bestScore: true },
  });
  const bestMap = new Map(progress.map((p) => [p.stageId, p.bestScore]));

  return [...map.values()]
    .map((r) => {
      const avg =
        r.scores.reduce((s, n) => s + n, 0) / Math.max(1, r.scores.length);
      return {
        ...r.stage,
        failCount: r.fails,
        avgScore: Math.round(avg),
        bestScore: bestMap.get(r.stage.stageId) ?? null,
      };
    })
    .filter((r) => r.failCount >= 1 || (r.bestScore != null && r.bestScore < 75))
    .sort((a, b) => b.failCount - a.failCount || a.avgScore - b.avgScore)
    .slice(0, limit);
}

/** Recommend next stage: remedial if weak, else next unlock, with skip on high scores */
export async function recommendNextStage(userId: string, language?: Language) {
  const weak = await getWeakSpots(userId, 3);
  const weakOpen = weak.find(
    (w) => !language || w.language === language
  );
  if (weakOpen && weakOpen.failCount >= 2) {
    return {
      type: "remedial" as const,
      stageId: weakOpen.stageId,
      reason: `Practice weak spot: ${weakOpen.title}`,
      expectedText: weakOpen.expectedText,
      language: weakOpen.language,
    };
  }

  const langs: Language[] = language
    ? [language]
    : (["ENGLISH", "GERMAN"] as Language[]);

  for (const lang of langs) {
    const stages = await prisma.stage.findMany({
      where: { language: lang },
      orderBy: { order: "asc" },
      include: {
        userProgress: { where: { userId }, take: 1 },
      },
    });

    let prevDone = true;
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i]!;
      const p = s.userProgress[0];
      const done = p?.isCompleted ?? false;
      const unlocked = prevDone;

      if (unlocked && !done) {
        // adaptive skip: if previous scored very high, hint "challenge" next A2/B1
        const prev = i > 0 ? stages[i - 1] : null;
        const prevScore = prev?.userProgress[0]?.bestScore ?? 0;
        return {
          type: "next" as const,
          stageId: s.id,
          reason:
            prevScore >= 90
              ? `You're hot — continue with ${s.title}`
              : `Continue: ${s.title}`,
          expectedText: s.expectedText,
          language: s.language,
          cefrLevel: s.cefrLevel,
        };
      }
      prevDone = done;
    }
  }

  if (weakOpen) {
    return {
      type: "review" as const,
      stageId: weakOpen.stageId,
      reason: `Review: ${weakOpen.title}`,
      expectedText: weakOpen.expectedText,
      language: weakOpen.language,
    };
  }

  return null;
}

export async function getRecommendedList(userId: string, limit = 5) {
  const out: {
    stageId: string;
    title: string;
    reason: string;
    language: Language;
    cefrLevel: CefrLevel;
    expectedText: string;
    kind: string;
  }[] = [];

  const next = await recommendNextStage(userId);
  if (next) {
    const stage = await prisma.stage.findUnique({
      where: { id: next.stageId },
    });
    if (stage) {
      out.push({
        stageId: stage.id,
        title: stage.title,
        reason: next.reason,
        language: stage.language,
        cefrLevel: stage.cefrLevel,
        expectedText: stage.expectedText,
        kind: next.type,
      });
    }
  }

  const weak = await getWeakSpots(userId, limit);
  for (const w of weak) {
    if (out.some((o) => o.stageId === w.stageId)) continue;
    out.push({
      stageId: w.stageId,
      title: w.title,
      reason: `Weak spot · avg ${w.avgScore}`,
      language: w.language,
      cefrLevel: w.cefrLevel,
      expectedText: w.expectedText,
      kind: "weak",
    });
    if (out.length >= limit) break;
  }

  return out;
}
