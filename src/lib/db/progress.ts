import { prisma } from "@/lib/db/prisma";
import {
  COOLDOWN_HOURS,
  MAX_ATTEMPTS,
  PASS_SCORE,
} from "@/lib/constants";
import type { Language } from "@/generated/prisma/client";

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
}) {
  const { userId, stageId, score } = params;
  const passed = score >= PASS_SCORE;

  const existing = await prisma.userProgress.findUnique({
    where: { userId_stageId: { userId, stageId } },
  });

  if (isOnCooldown(existing?.cooldownUntil)) {
    return {
      error: "cooldown",
      progress: existing,
      passed: false,
    } as const;
  }

  const attemptsCount = (existing?.attemptsCount ?? 0) + (passed ? 0 : 1);
  const hitLimit = !passed && attemptsCount >= MAX_ATTEMPTS;
  const cooldownUntil = hitLimit
    ? new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000)
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

  return { progress, passed, hitLimit } as const;
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
