import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";

export const LEAGUE_TIERS = [
  "bronze",
  "silver",
  "gold",
  "sapphire",
  "ruby",
] as const;

export type LeagueTier = (typeof LEAGUE_TIERS)[number];

/** ISO week key YYYY-Www */
export function weekKey(d = new Date()) {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function ensureWeekXp(userId: string) {
  const key = weekKey();
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) {
    return prisma.userStats.create({
      data: { userId, weekKey: key, weekXp: 0, leagueTier: "bronze" },
    });
  }
  if (stats.weekKey !== key) {
    // simple promotion/demotion based on last weekXp
    let tier = (stats.leagueTier as LeagueTier) || "bronze";
    const idx = LEAGUE_TIERS.indexOf(tier);
    if (stats.weekXp >= 200 && idx < LEAGUE_TIERS.length - 1) {
      tier = LEAGUE_TIERS[idx + 1]!;
    } else if (stats.weekXp < 50 && idx > 0) {
      tier = LEAGUE_TIERS[idx - 1]!;
    }
    return prisma.userStats.update({
      where: { userId },
      data: { weekKey: key, weekXp: 0, leagueTier: tier },
    });
  }
  return stats;
}

export async function addWeekXp(userId: string, amount: number) {
  await ensureWeekXp(userId);
  return prisma.userStats.update({
    where: { userId },
    data: { weekXp: { increment: amount } },
  });
}

export async function getLeagueBoard(userId: string, limit = 20) {
  await ensureWeekXp(userId);
  const me = await prisma.userStats.findUnique({ where: { userId } });
  const tier = me?.leagueTier ?? "bronze";
  const key = me?.weekKey ?? weekKey();

  const rows = await prisma.userStats.findMany({
    where: {
      leaderboardOptIn: true,
      leagueTier: tier,
      weekKey: key,
    },
    orderBy: { weekXp: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  return {
    tier,
    weekKey: key,
    rows: rows.map((r, i) => ({
      rank: i + 1,
      name: r.user.name || r.user.email.split("@")[0] || "Learner",
      weekXp: r.weekXp,
      level: r.level,
      isMe: r.userId === userId,
    })),
  };
}

// silence unused
void todayKey;
