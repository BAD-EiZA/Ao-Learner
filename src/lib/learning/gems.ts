import { prisma } from "@/lib/db/prisma";

export async function getGems(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  return s?.gems ?? 0;
}

export async function awardGems(userId: string, amount: number) {
  if (amount <= 0) return getGems(userId);
  const s = await prisma.userStats.upsert({
    where: { userId },
    create: { userId, gems: amount },
    update: { gems: { increment: amount } },
  });
  return s.gems;
}

export async function spendGems(userId: string, amount: number) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  if (!s || s.gems < amount) return { ok: false as const, gems: s?.gems ?? 0 };
  const next = await prisma.userStats.update({
    where: { userId },
    data: { gems: { decrement: amount } },
  });
  return { ok: true as const, gems: next.gems };
}

/** Gems from a passed attempt */
export function gemsForScore(score: number, passed: boolean) {
  if (!passed) return 0;
  if (score >= 95) return 5;
  if (score >= 80) return 3;
  return 1;
}
