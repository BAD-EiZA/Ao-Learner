export const STREAK_MILESTONES = [
  { days: 3, title: "Warm-up", emoji: "🌱", xp: 10, gems: 5 },
  { days: 7, title: "Week Warrior", emoji: "🔥", xp: 50, gems: 15 },
  { days: 14, title: "Fortnight Force", emoji: "💪", xp: 80, gems: 25 },
  { days: 30, title: "Monthly Master", emoji: "🏆", xp: 150, gems: 50 },
  { days: 100, title: "Century Club", emoji: "💎", xp: 400, gems: 100 },
] as const;

export function milestoneForStreak(streak: number) {
  return [...STREAK_MILESTONES].reverse().find((m) => streak >= m.days) ?? null;
}

export function nextMilestone(streak: number) {
  return STREAK_MILESTONES.find((m) => streak < m.days) ?? null;
}

export async function claimStreakMilestone(userId: string, days: number) {
  const def = STREAK_MILESTONES.find((m) => m.days === days);
  if (!def) return { ok: false as const, reason: "unknown" };

  const { prisma } = await import("@/lib/db/prisma");
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats || stats.currentStreak < days)
    return { ok: false as const, reason: "streak" };

  const code = `streak_${days}`;
  const existing = await prisma.userAchievement.findUnique({
    where: { userId_code: { userId, code } },
  });
  if (existing) return { ok: false as const, reason: "claimed" };

  await prisma.userAchievement.create({ data: { userId, code } });
  const { awardXp } = await import("@/lib/learning/xp");
  const { awardGems } = await import("@/lib/learning/gems");
  await awardXp(userId, def.xp);
  await awardGems(userId, def.gems);
  return { ok: true as const, ...def };
}

export async function getStreakSociety(userId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  const streak = stats?.currentStreak ?? 0;
  const longest = stats?.longestStreak ?? 0;
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId, code: { startsWith: "streak_" } },
  });
  const set = new Set(unlocked.map((u) => u.code));
  return {
    streak,
    longest,
    milestones: STREAK_MILESTONES.map((m) => ({
      ...m,
      reached: streak >= m.days,
      claimed: set.has(`streak_${m.days}`),
    })),
    current: milestoneForStreak(streak),
    next: nextMilestone(streak),
  };
}
