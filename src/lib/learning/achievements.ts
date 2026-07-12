import { prisma } from "@/lib/db/prisma";
import { awardXp } from "@/lib/learning/xp";

export type AchievementDef = {
  code: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: "first_perfect",
    title: "Flawless",
    description: "Score 95+ on any phrase",
    emoji: "💎",
    xp: 30,
  },
  {
    code: "streak_7",
    title: "Week Warrior",
    description: "7-day streak",
    emoji: "🔥",
    xp: 50,
  },
  {
    code: "a1_clear",
    title: "A1 Cleared",
    description: "Complete all A1 stages in a language",
    emoji: "🌱",
    xp: 80,
  },
  {
    code: "first_roleplay",
    title: "Actor",
    description: "Finish a role-play scenario",
    emoji: "🎭",
    xp: 40,
  },
  {
    code: "xp_100_day",
    title: "Century Day",
    description: "Earn 100 XP in one day",
    emoji: "⚡",
    xp: 40,
  },
  {
    code: "combo_5",
    title: "On a Roll",
    description: "5 correct answers in a row",
    emoji: "🎯",
    xp: 25,
  },
  {
    code: "shadow_master",
    title: "Echo",
    description: "Complete 5 shadow sessions",
    emoji: "🔊",
    xp: 35,
  },
  {
    code: "placement_done",
    title: "Placed",
    description: "Finish placement test",
    emoji: "📍",
    xp: 15,
  },
];

export async function unlockAchievement(userId: string, code: string) {
  const def = ACHIEVEMENTS.find((a) => a.code === code);
  if (!def) return null;
  try {
    const created = await prisma.userAchievement.create({
      data: { userId, code },
    });
    await awardXp(userId, def.xp);
    return { ...def, unlockedAt: created.unlockedAt };
  } catch {
    return null; // already unlocked
  }
}

export async function getUserAchievements(userId: string) {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
  });
  const set = new Set(unlocked.map((u) => u.code));
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: set.has(a.code),
    unlockedAt: unlocked.find((u) => u.code === a.code)?.unlockedAt ?? null,
  }));
}

/** Check and unlock based on attempt context */
export async function checkAchievementsAfterAttempt(params: {
  userId: string;
  score: number;
  passed: boolean;
  combo: number;
  isRoleplay?: boolean;
  isShadow?: boolean;
}) {
  const unlocked: AchievementDef[] = [];
  if (params.score >= 95) {
    const u = await unlockAchievement(params.userId, "first_perfect");
    if (u) unlocked.push(u);
  }
  if (params.combo >= 5) {
    const u = await unlockAchievement(params.userId, "combo_5");
    if (u) unlocked.push(u);
  }
  if (params.isRoleplay && params.passed) {
    const u = await unlockAchievement(params.userId, "first_roleplay");
    if (u) unlocked.push(u);
  }

  const stats = await prisma.userStats.findUnique({
    where: { userId: params.userId },
  });
  if (stats) {
    if (stats.currentStreak >= 7) {
      const u = await unlockAchievement(params.userId, "streak_7");
      if (u) unlocked.push(u);
    }
    if (stats.dailyXpEarned >= 100) {
      const u = await unlockAchievement(params.userId, "xp_100_day");
      if (u) unlocked.push(u);
    }
  }

  // A1 clear check (either language)
  for (const lang of ["ENGLISH", "GERMAN"] as const) {
    const a1 = await prisma.stage.findMany({
      where: { language: lang, cefrLevel: "A1", mode: "PHRASE" },
      select: { id: true },
    });
    if (a1.length === 0) continue;
    const done = await prisma.userProgress.count({
      where: {
        userId: params.userId,
        isCompleted: true,
        stageId: { in: a1.map((s) => s.id) },
      },
    });
    if (done >= a1.length) {
      const u = await unlockAchievement(params.userId, "a1_clear");
      if (u) unlocked.push(u);
    }
  }

  return unlocked;
}
