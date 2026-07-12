import { prisma } from "@/lib/db/prisma";
import { levelFromXp } from "@/lib/learning/xp-math";

export {
  xpForLevel,
  levelFromXp,
  xpProgress,
  xpForScore,
  LEVEL_BADGES,
  badgeForLevel,
} from "@/lib/learning/xp-math";

export async function awardXp(userId: string, amount: number) {
  const existing = await prisma.userStats.findUnique({ where: { userId } });
  if (!existing) {
    const xp = amount;
    const level = levelFromXp(xp);
    return prisma.userStats.create({
      data: {
        userId,
        xp,
        level,
        currentStreak: 0,
        longestStreak: 0,
        totalAttempts: 0,
        totalPassed: 0,
      },
    });
  }
  const xp = existing.xp + amount;
  const level = levelFromXp(xp);
  return prisma.userStats.update({
    where: { userId },
    data: { xp, level },
  });
}
