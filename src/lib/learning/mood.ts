import { prisma } from "@/lib/db/prisma";

export type AoMood = "happy" | "neutral" | "concerned" | "proud";

export function moodFromStats(params: {
  currentStreak: number;
  lastActiveDate: Date | null;
  consecutivePasses: number;
  totalPassed: number;
}): AoMood {
  const { currentStreak, lastActiveDate, consecutivePasses, totalPassed } =
    params;

  if (lastActiveDate) {
    const days = Math.floor(
      (Date.now() - lastActiveDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (days >= 2) return "concerned";
  }

  if (consecutivePasses >= 3 || currentStreak >= 7) return "proud";
  if (currentStreak >= 3 || totalPassed >= 10) return "happy";
  return "neutral";
}

export async function refreshAoMood(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return "neutral" as AoMood;

  // compute display streak break
  let streak = stats.currentStreak;
  if (stats.lastActiveDate) {
    const days = Math.floor(
      (Date.now() - stats.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (days > 1) streak = 0;
  }

  const aoMood = moodFromStats({
    currentStreak: streak,
    lastActiveDate: stats.lastActiveDate,
    consecutivePasses: stats.consecutivePasses,
    totalPassed: stats.totalPassed,
  });

  await prisma.userStats.update({
    where: { userId },
    data: { aoMood },
  });

  return aoMood;
}

export function moodToEmotion(
  mood: AoMood
): "joy" | "neutral" | "sorrow" | "fun" {
  if (mood === "happy" || mood === "proud") return "joy";
  if (mood === "concerned") return "sorrow";
  return "neutral";
}
