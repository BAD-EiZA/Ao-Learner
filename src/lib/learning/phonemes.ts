import { prisma } from "@/lib/db/prisma";
import type { Language } from "@/generated/prisma/client";
import { bucketsFromStage } from "@/lib/learning/phoneme-labels";

export { bucketsFromStage, BUCKET_LABELS } from "@/lib/learning/phoneme-labels";

export async function recordPhonemeStats(params: {
  userId: string;
  language: Language;
  tags: string[];
  expectedText: string;
  score: number;
  passed: boolean;
  feedback?: string | null;
}) {
  const buckets = bucketsFromStage(params);
  for (const bucket of buckets) {
    await prisma.phonemeStat.upsert({
      where: {
        userId_bucket_language: {
          userId: params.userId,
          bucket,
          language: params.language,
        },
      },
      create: {
        userId: params.userId,
        bucket,
        language: params.language,
        attempts: 1,
        fails: params.passed ? 0 : 1,
        sumScore: params.score,
      },
      update: {
        attempts: { increment: 1 },
        fails: params.passed ? undefined : { increment: 1 },
        sumScore: { increment: params.score },
      },
    });
  }
}

export async function getSkillHeatmap(userId: string) {
  const rows = await prisma.phonemeStat.findMany({
    where: { userId },
    orderBy: { attempts: "desc" },
  });

  return rows.map((r) => ({
    bucket: r.bucket,
    language: r.language,
    attempts: r.attempts,
    fails: r.fails,
    avgScore: r.attempts ? Math.round(r.sumScore / r.attempts) : 0,
    failRate: r.attempts ? Math.round((r.fails / r.attempts) * 100) : 0,
  }));
}
