import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";

export const XP_GOALS = [10, 20, 30] as const;

export async function ensureDailyXpBucket(userId: string) {
  const key = todayKey();
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) {
    return prisma.userStats.create({
      data: {
        userId,
        dailyXpDate: key,
        dailyXpEarned: 0,
        dailyXpGoal: 20,
      },
    });
  }
  if (stats.dailyXpDate !== key) {
    return prisma.userStats.update({
      where: { userId },
      data: { dailyXpDate: key, dailyXpEarned: 0 },
    });
  }
  return stats;
}

export async function addDailyXp(userId: string, amount: number) {
  await ensureDailyXpBucket(userId);
  return prisma.userStats.update({
    where: { userId },
    data: { dailyXpEarned: { increment: amount } },
  });
}

export async function setDailyXpGoal(userId: string, goal: number) {
  const g = XP_GOALS.includes(goal as (typeof XP_GOALS)[number]) ? goal : 20;
  return prisma.userStats.upsert({
    where: { userId },
    create: { userId, dailyXpGoal: g },
    update: { dailyXpGoal: g },
  });
}

export async function getDailyGoalState(userId: string) {
  const s = await ensureDailyXpBucket(userId);
  const goal = s.dailyXpGoal || 20;
  const earned = s.dailyXpEarned || 0;
  return {
    goal,
    earned,
    pct: Math.min(100, Math.round((earned / goal) * 100)),
    met: earned >= goal,
    dateKey: s.dailyXpDate ?? todayKey(),
  };
}
