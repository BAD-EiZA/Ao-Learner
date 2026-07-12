import { prisma } from "@/lib/db/prisma";

/** SM-2 inspired scheduling */
export function nextReviewSchedule(params: {
  score: number;
  passed: boolean;
  ease: number;
  intervalDays: number;
  repetitions: number;
}) {
  let { ease, intervalDays, repetitions } = params;
  const q = params.passed
    ? params.score >= 90
      ? 5
      : params.score >= 75
        ? 4
        : 3
    : params.score >= 40
      ? 2
      : 1;

  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 3;
    else intervalDays = Math.round(intervalDays * ease);
    repetitions += 1;
  }

  const dueAt = new Date();
  dueAt.setUTCDate(dueAt.getUTCDate() + intervalDays);
  dueAt.setUTCHours(0, 0, 0, 0);

  return { ease, intervalDays, repetitions, dueAt, quality: q };
}

export async function upsertReviewFromAttempt(params: {
  userId: string;
  stageId: string;
  score: number;
  passed: boolean;
}) {
  const existing = await prisma.reviewItem.findUnique({
    where: {
      userId_stageId: { userId: params.userId, stageId: params.stageId },
    },
  });

  const sched = nextReviewSchedule({
    score: params.score,
    passed: params.passed,
    ease: existing?.ease ?? 2.5,
    intervalDays: existing?.intervalDays ?? 1,
    repetitions: existing?.repetitions ?? 0,
  });

  // always schedule if failed or score < 90; if perfect, still light review later
  return prisma.reviewItem.upsert({
    where: {
      userId_stageId: { userId: params.userId, stageId: params.stageId },
    },
    create: {
      userId: params.userId,
      stageId: params.stageId,
      dueAt: sched.dueAt,
      ease: sched.ease,
      intervalDays: sched.intervalDays,
      repetitions: sched.repetitions,
      lastScore: params.score,
    },
    update: {
      dueAt: sched.dueAt,
      ease: sched.ease,
      intervalDays: sched.intervalDays,
      repetitions: sched.repetitions,
      lastScore: params.score,
    },
  });
}

export async function getDueReviews(userId: string, limit = 12) {
  const now = new Date();
  return prisma.reviewItem.findMany({
    where: { userId, dueAt: { lte: now } },
    orderBy: { dueAt: "asc" },
    take: limit,
    include: {
      stage: {
        select: {
          id: true,
          title: true,
          expectedText: true,
          meaningId: true,
          language: true,
          cefrLevel: true,
          referenceAudio: true,
          mode: true,
        },
      },
    },
  });
}

export async function getReviewQueueCount(userId: string) {
  return prisma.reviewItem.count({
    where: { userId, dueAt: { lte: new Date() } },
  });
}
