import { prisma } from "@/lib/db/prisma";
import { weekKey } from "@/lib/learning/leagues";
import { getUserAchievements } from "@/lib/learning/achievements";
import { getSkillHeatmap } from "@/lib/learning/phonemes";

export async function getWeeklyReport(userId: string) {
  const key = weekKey();
  // week start = Monday UTC of ISO week
  const [y, w] = key.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y!, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - day + 1 + (w! - 1) * 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const attempts = await prisma.attemptHistory.findMany({
    where: { userId, createdAt: { gte: weekStart } },
    orderBy: { createdAt: "desc" },
  });

  const total = attempts.length;
  const passed = attempts.filter((a) => a.passed).length;
  const avgScore =
    total === 0
      ? 0
      : Math.round(attempts.reduce((s, a) => s + a.score, 0) / total);

  const stats = await prisma.userStats.findUnique({ where: { userId } });
  const heat = await getSkillHeatmap(userId);
  const weak = heat
    .filter((h) => h.avgScore != null && h.avgScore < 65)
    .slice(0, 5);

  const achievements = await getUserAchievements(userId);
  const unlockedThisWeek = achievements.filter(
    (a) =>
      a.unlocked &&
      a.unlockedAt &&
      new Date(a.unlockedAt).getTime() >= weekStart.getTime()
  );

  // active days this week
  const daySet = new Set(
    attempts.map((a) => a.createdAt.toISOString().slice(0, 10))
  );

  return {
    weekKey: key,
    weekStart: weekStart.toISOString(),
    totalAttempts: total,
    passed,
    failRate: total ? Math.round(((total - passed) / total) * 100) : 0,
    avgScore,
    xp: stats?.xp ?? 0,
    weekXp: stats?.weekXp ?? 0,
    level: stats?.level ?? 1,
    streak: stats?.currentStreak ?? 0,
    leagueTier: stats?.leagueTier ?? "bronze",
    activeDays: daySet.size,
    weakSpots: weak.map((w) => ({
      bucket: w.bucket,
      avgScore: w.avgScore,
      language: w.language,
    })),
    badgesUnlocked: unlockedThisWeek.map((a) => ({
      code: a.code,
      title: a.title,
      emoji: a.emoji,
    })),
  };
}
