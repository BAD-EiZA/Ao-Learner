import { prisma } from "@/lib/db/prisma";

export async function setLeaderboardOptIn(userId: string, optIn: boolean) {
  return prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      leaderboardOptIn: optIn,
      currentStreak: 0,
      longestStreak: 0,
    },
    update: { leaderboardOptIn: optIn },
  });
}

export async function getLeaderboard(limit = 20) {
  const rows = await prisma.userStats.findMany({
    where: { leaderboardOptIn: true },
    orderBy: [{ xp: "desc" }, { totalPassed: "desc" }],
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.user.name || r.user.email.split("@")[0] || "Learner",
    xp: r.xp,
    level: r.level,
    streak: r.currentStreak,
    passed: r.totalPassed,
  }));
}

export async function getMyLeaderboardFlag(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  return s?.leaderboardOptIn ?? false;
}
