import { prisma } from "@/lib/db/prisma";

function utcDateOnly(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date) {
  const ms = utcDateOnly(b).getTime() - utcDateOnly(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export async function touchUserActivity(userId: string, passed: boolean) {
  const today = utcDateOnly();
  const existing = await prisma.userStats.findUnique({ where: { userId } });

  if (!existing) {
    return prisma.userStats.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        totalAttempts: 1,
        totalPassed: passed ? 1 : 0,
        hearts: 5,
      },
    });
  }

  let currentStreak = existing.currentStreak;
  const last = existing.lastActiveDate
    ? utcDateOnly(existing.lastActiveDate)
    : null;
  const todayKeyStr = dayKey(today);

  if (!last) {
    currentStreak = 1;
  } else {
    const diff = daysBetween(last, today);
    if (diff === 0) {
      // same day
    } else if (diff === 1) {
      currentStreak = existing.currentStreak + 1;
    } else if (diff === 2 && existing.streakFreezes > 0) {
      // auto-consume freeze to save streak
      currentStreak = existing.currentStreak + 1;
      await prisma.userStats.update({
        where: { userId },
        data: {
          streakFreezes: { decrement: 1 },
          freezeUsedDate: todayKeyStr,
        },
      });
    } else {
      currentStreak = 1;
      if (diff >= 3) {
        try {
          const { markComebackPending } = await import(
            "@/lib/learning/comeback"
          );
          await markComebackPending(userId, diff);
        } catch {
          /* non-fatal */
        }
      }
    }
  }

  const longestStreak = Math.max(existing.longestStreak, currentStreak);

  return prisma.userStats.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      totalAttempts: { increment: 1 },
      totalPassed: passed ? { increment: 1 } : undefined,
    },
  });
}

export async function getUserStats(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalAttempts: 0,
      totalPassed: 0,
      lastActiveDate: null as string | null,
      xp: 0,
      level: 1,
      placementDone: false,
      placementCefr: null as string | null,
      passBoost: 0,
      leaderboardOptIn: false,
      hearts: 5,
      dailyXpGoal: 20,
      dailyXpEarned: 0,
      streakFreezes: 1,
      combo: 0,
      learningWhy: null as string | null,
      isPlus: false,
      plusUntil: null as string | null,
      leagueTier: "bronze",
      weekXp: 0,
      aoMood: "neutral",
    };
  }

  let currentStreak = stats.currentStreak;
  if (stats.lastActiveDate) {
    const diff = daysBetween(stats.lastActiveDate, new Date());
    if (diff > 1) currentStreak = 0;
  }

  const isPlus =
    stats.isPlus && (!stats.plusUntil || stats.plusUntil > new Date());

  return {
    currentStreak,
    longestStreak: stats.longestStreak,
    totalAttempts: stats.totalAttempts,
    totalPassed: stats.totalPassed,
    lastActiveDate: stats.lastActiveDate
      ? dayKey(stats.lastActiveDate)
      : null,
    xp: stats.xp,
    level: stats.level,
    placementDone: stats.placementDone,
    placementCefr: stats.placementCefr,
    passBoost: stats.passBoost,
    leaderboardOptIn: stats.leaderboardOptIn,
    hearts: stats.hearts,
    dailyXpGoal: stats.dailyXpGoal,
    dailyXpEarned: stats.dailyXpEarned,
    streakFreezes: stats.streakFreezes,
    combo: stats.combo,
    learningWhy: stats.learningWhy,
    isPlus,
    plusUntil: stats.plusUntil?.toISOString() ?? null,
    leagueTier: stats.leagueTier,
    weekXp: stats.weekXp,
    aoMood: stats.aoMood,
  };
}

export function todayKey() {
  return dayKey(new Date());
}
