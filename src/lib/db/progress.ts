import { prisma } from "@/lib/db/prisma";
import {
  COOLDOWN_HOURS,
  MAX_ATTEMPTS,
  PASS_SCORE,
  PLUS_COOLDOWN_HOURS,
} from "@/lib/constants";
import type { Language } from "@/generated/prisma/client";

export type StageTurn = {
  expectedText: string;
  meaningId: string;
  prompt?: string;
};

export function isOnCooldown(cooldownUntil: Date | null | undefined) {
  if (!cooldownUntil) return false;
  return cooldownUntil.getTime() > Date.now();
}

export async function getStagesWithProgress(
  userId: string,
  language: Language
) {
  const stages = await prisma.stage.findMany({
    where: { language },
    orderBy: { order: "asc" },
    include: {
      userProgress: {
        where: { userId },
        take: 1,
      },
    },
  });

  let previousCompleted = true;

  return stages.map((stage) => {
    const progress = stage.userProgress[0] ?? null;
    const unlocked = previousCompleted;
    const completed = progress?.isCompleted ?? false;
    const cooldownActive = isOnCooldown(progress?.cooldownUntil);

    if (completed) previousCompleted = true;
    else previousCompleted = false;

    return {
      id: stage.id,
      language: stage.language,
      title: stage.title,
      description: stage.description,
      expectedText: stage.expectedText,
      meaningId: stage.meaningId ?? "",
      referenceAudio: stage.referenceAudio,
      order: stage.order,
      cefrLevel: stage.cefrLevel as "A1" | "A2" | "B1",
      mode: stage.mode as
        | "PHRASE"
        | "DIALOGUE"
        | "ROLEPLAY"
        | "STORY",
      turns: (stage.turns as StageTurn[] | null) ?? null,
      unlocked,
      isCompleted: completed,
      attemptsCount: progress?.attemptsCount ?? 0,
      attemptsLeft: Math.max(
        0,
        MAX_ATTEMPTS - (progress?.attemptsCount ?? 0)
      ),
      bestScore: progress?.bestScore ?? null,
      cooldownUntil: progress?.cooldownUntil?.toISOString() ?? null,
      cooldownActive,
      crowns: progress?.crowns ?? 0,
      legendary: progress?.legendary ?? false,
    };
  });
}

export async function getStageForUser(userId: string, stageId: string) {
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!stage) return null;

  const list = await getStagesWithProgress(userId, stage.language);
  return list.find((s) => s.id === stageId) ?? null;
}

export async function getStageNeighbors(userId: string, stageId: string) {
  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!stage) return { prevId: null, nextId: null };

  const list = await getStagesWithProgress(userId, stage.language);
  const idx = list.findIndex((s) => s.id === stageId);
  if (idx < 0) return { prevId: null, nextId: null };

  return {
    prevId: idx > 0 ? list[idx - 1]!.id : null,
    nextId: idx < list.length - 1 ? list[idx + 1]!.id : null,
  };
}

export async function applyAttempt(params: {
  userId: string;
  stageId: string;
  score: number;
  feedback?: string | null;
  skipCooldown?: boolean;
  /** When set, overrides PASS_SCORE for isCompleted */
  passThreshold?: number;
  isRoleplay?: boolean;
  isShadow?: boolean;
  hardMode?: boolean;
}) {
  const {
    userId,
    stageId,
    score,
    feedback,
    skipCooldown,
    passThreshold,
    isRoleplay,
    isShadow,
    hardMode,
  } = params;
  const threshold = passThreshold ?? PASS_SCORE;
  const passed = score >= threshold;

  const existing = await prisma.userProgress.findUnique({
    where: { userId_stageId: { userId, stageId } },
  });

  if (!skipCooldown && isOnCooldown(existing?.cooldownUntil)) {
    return {
      error: "cooldown" as const,
      progress: existing,
      passed: false,
    };
  }

  const attemptsCount = (existing?.attemptsCount ?? 0) + (passed ? 0 : 1);
  const hitLimit = !passed && !skipCooldown && attemptsCount >= MAX_ATTEMPTS;

  // Plus: shorter cooldown (or none if PLUS_COOLDOWN_HOURS=0)
  let cooldownHours = COOLDOWN_HOURS;
  if (hitLimit) {
    try {
      const { getPlusState } = await import("@/lib/learning/plus");
      const plus = await getPlusState(userId);
      if (plus.isPlus) cooldownHours = PLUS_COOLDOWN_HOURS;
    } catch {
      /* non-fatal */
    }
  }
  const cooldownUntil =
    hitLimit && cooldownHours > 0
      ? new Date(Date.now() + cooldownHours * 60 * 60 * 1000)
      : null;

  const bestScore = Math.max(existing?.bestScore ?? 0, score);

  const progress = await prisma.userProgress.upsert({
    where: { userId_stageId: { userId, stageId } },
    create: {
      userId,
      stageId,
      isCompleted: passed,
      attemptsCount: passed ? 0 : 1,
      bestScore: score,
      cooldownUntil,
      lastAttemptAt: new Date(),
    },
    update: {
      isCompleted: passed || (existing?.isCompleted ?? false),
      attemptsCount: passed ? 0 : attemptsCount,
      bestScore,
      cooldownUntil: hitLimit
        ? cooldownUntil
        : passed
          ? null
          : existing?.cooldownUntil ?? null,
      lastAttemptAt: new Date(),
    },
  });

  // side effects: history + streak + xp + srs + difficulty
  const { recordAttemptHistory } = await import("@/lib/db/history");
  const { touchUserActivity } = await import("@/lib/db/streak");
  const { completeDailyChallenge } = await import("@/lib/db/daily");
  const { awardXp, xpForScore } = await import("@/lib/learning/xp");
  const { upsertReviewFromAttempt } = await import("@/lib/learning/srs");
  const { updateDifficultyBoost } = await import("@/lib/learning/adaptive");

  await recordAttemptHistory({
    userId,
    stageId,
    score,
    passed,
    feedback,
  });
  await touchUserActivity(userId, passed);
  await completeDailyChallenge({ userId, stageId, score, passed });
  // combo
  const statsRow = await prisma.userStats.findUnique({ where: { userId } });
  let combo = statsRow?.combo ?? 0;
  if (passed) combo += 1;
  else combo = 0;
  const comboMultiplier = Math.min(2, 1 + Math.floor(combo / 3) * 0.25);
  let xpGain = Math.round(xpForScore(score, passed) * comboMultiplier);
  if (hardMode && passed) xpGain = Math.round(xpGain * 1.25);
  await awardXp(userId, xpGain);
  await upsertReviewFromAttempt({ userId, stageId, score, passed });
  await updateDifficultyBoost(userId, score, passed);

  // daily xp goal + week league xp + gems + crowns
  try {
    const { addDailyXp } = await import("@/lib/learning/goals");
    const { addWeekXp } = await import("@/lib/learning/leagues");
    const { bumpQuest } = await import("@/lib/learning/quests");
    const { checkAchievementsAfterAttempt } = await import(
      "@/lib/learning/achievements"
    );
    const { awardGems, gemsForScore } = await import("@/lib/learning/gems");
    const { applyCrowns } = await import("@/lib/learning/crowns");
    const { maybeBankPassedPhrase } = await import("@/lib/learning/bank");
    const { addClubXp } = await import("@/lib/learning/club");
    await addDailyXp(userId, xpGain);
    await addWeekXp(userId, xpGain);
    const g = gemsForScore(score, passed);
    if (g > 0) await awardGems(userId, g);
    if (passed) await applyCrowns(userId, stageId, score, !!hardMode);
    await maybeBankPassedPhrase({ userId, stageId, score, passed });
    if (xpGain > 0) await addClubXp(userId, xpGain);
    await prisma.userStats.update({
      where: { userId },
      data: { combo },
    });
    if (passed) await bumpQuest(userId, "stage_passed");
    if (score >= 80) await bumpQuest(userId, "score_80");
    if (isShadow) await bumpQuest(userId, "shadow_done");
    await checkAchievementsAfterAttempt({
      userId,
      score,
      passed,
      combo,
      isRoleplay,
      isShadow,
    });
  } catch {
    /* non-fatal */
  }

  try {
    const stageMeta = await prisma.stage.findUnique({
      where: { id: stageId },
      select: { language: true, tags: true, expectedText: true },
    });
    if (stageMeta) {
      const { recordPhonemeStats } = await import("@/lib/learning/phonemes");
      await recordPhonemeStats({
        userId,
        language: stageMeta.language,
        tags: stageMeta.tags,
        expectedText: stageMeta.expectedText,
        score,
        passed,
        feedback,
      });
    }
    const { refreshAoMood } = await import("@/lib/learning/mood");
    await refreshAoMood(userId);
    const { trackServer } = await import("@/lib/analytics-server");
    await trackServer(passed ? "stage_passed" : "stage_failed", {
      userId,
      props: { stageId, score, xpGain, combo },
    });
    await trackServer("stage_attempt", {
      userId,
      props: { stageId, score, passed },
    });
  } catch {
    /* non-fatal */
  }

  return { progress, passed, hitLimit, xpGain, combo } as const;
}

export async function clearExpiredCooldown(userId: string, stageId: string) {
  const progress = await prisma.userProgress.findUnique({
    where: { userId_stageId: { userId, stageId } },
  });
  if (!progress?.cooldownUntil) return progress;
  if (progress.cooldownUntil.getTime() > Date.now()) return progress;

  return prisma.userProgress.update({
    where: { id: progress.id },
    data: { cooldownUntil: null, attemptsCount: 0 },
  });
}
