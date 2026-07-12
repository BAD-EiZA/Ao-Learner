import { prisma } from "@/lib/db/prisma";

/** Map best score → crown level 0–5 */
export function crownsFromScore(bestScore: number | null | undefined) {
  if (bestScore == null) return 0;
  if (bestScore >= 98) return 5;
  if (bestScore >= 92) return 4;
  if (bestScore >= 85) return 3;
  if (bestScore >= 75) return 2;
  if (bestScore >= 60) return 1;
  return 0;
}

export function isLegendaryScore(score: number, hardMode: boolean) {
  return hardMode && score >= 95;
}

export async function applyCrowns(
  userId: string,
  stageId: string,
  score: number,
  hardMode = false
) {
  const existing = await prisma.userProgress.findUnique({
    where: { userId_stageId: { userId, stageId } },
  });
  const best = Math.max(existing?.bestScore ?? 0, score);
  const crowns = crownsFromScore(best);
  const legendary =
    (existing?.legendary ?? false) || isLegendaryScore(score, hardMode);

  await prisma.userProgress.update({
    where: { userId_stageId: { userId, stageId } },
    data: { crowns, legendary },
  });

  return { crowns, legendary, best };
}

export function crownEmoji(n: number) {
  return "👑".repeat(Math.min(5, Math.max(0, n)));
}
