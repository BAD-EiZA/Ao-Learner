import { prisma } from "@/lib/db/prisma";

export async function recordAttemptHistory(params: {
  userId: string;
  stageId: string;
  score: number;
  passed: boolean;
  feedback?: string | null;
}) {
  return prisma.attemptHistory.create({
    data: {
      userId: params.userId,
      stageId: params.stageId,
      score: params.score,
      passed: params.passed,
      feedback: params.feedback ?? null,
    },
  });
}

export async function getRecentAttempts(userId: string, limit = 12) {
  const rows = await prisma.attemptHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      stage: {
        select: {
          title: true,
          language: true,
          expectedText: true,
          meaningId: true,
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    score: r.score,
    passed: r.passed,
    feedback: r.feedback,
    createdAt: r.createdAt.toISOString(),
    stageTitle: r.stage.title,
    language: r.stage.language,
    expectedText: r.stage.expectedText,
    meaningId: r.stage.meaningId,
  }));
}

export async function getStageAttemptHistory(
  userId: string,
  stageId: string,
  limit = 8
) {
  return prisma.attemptHistory.findMany({
    where: { userId, stageId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      score: true,
      passed: true,
      feedback: true,
      createdAt: true,
    },
  });
}
