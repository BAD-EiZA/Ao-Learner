import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";
import { awardXp } from "@/lib/learning/xp";

export type QuestDef = {
  code: string;
  title: string;
  target: number;
  rewardXp: number;
  /** event keys that increment this quest */
  events: string[];
};

export const DAILY_QUESTS: QuestDef[] = [
  {
    code: "complete_3",
    title: "Complete 3 stages",
    target: 3,
    rewardXp: 25,
    events: ["stage_passed"],
  },
  {
    code: "score_80",
    title: "Score 80+ once",
    target: 1,
    rewardXp: 15,
    events: ["score_80"],
  },
  {
    code: "shadow_1",
    title: "Do 1 shadow session",
    target: 1,
    rewardXp: 15,
    events: ["shadow_done"],
  },
];

export async function ensureDailyQuests(userId: string) {
  const dateKey = todayKey();
  for (const q of DAILY_QUESTS) {
    await prisma.questProgress.upsert({
      where: {
        userId_questCode_dateKey: {
          userId,
          questCode: q.code,
          dateKey,
        },
      },
      create: {
        userId,
        questCode: q.code,
        dateKey,
        progress: 0,
        target: q.target,
      },
      update: {},
    });
  }
}

export async function getDailyQuests(userId: string) {
  await ensureDailyQuests(userId);
  const dateKey = todayKey();
  const rows = await prisma.questProgress.findMany({
    where: { userId, dateKey },
  });
  return DAILY_QUESTS.map((q) => {
    const row = rows.find((r) => r.questCode === q.code);
    return {
      ...q,
      progress: row?.progress ?? 0,
      completed: row?.completed ?? false,
      claimed: row?.claimed ?? false,
    };
  });
}

export async function bumpQuest(
  userId: string,
  event: string,
  amount = 1
) {
  await ensureDailyQuests(userId);
  const dateKey = todayKey();
  const matching = DAILY_QUESTS.filter((q) => q.events.includes(event));
  for (const q of matching) {
    const row = await prisma.questProgress.findUnique({
      where: {
        userId_questCode_dateKey: {
          userId,
          questCode: q.code,
          dateKey,
        },
      },
    });
    if (!row || row.completed) continue;
    const progress = Math.min(row.target, row.progress + amount);
    const completed = progress >= row.target;
    await prisma.questProgress.update({
      where: { id: row.id },
      data: { progress, completed },
    });
  }
}

export async function claimQuest(userId: string, questCode: string) {
  const dateKey = todayKey();
  const def = DAILY_QUESTS.find((q) => q.code === questCode);
  if (!def) return { ok: false as const, reason: "unknown" };
  const row = await prisma.questProgress.findUnique({
    where: {
      userId_questCode_dateKey: { userId, questCode, dateKey },
    },
  });
  if (!row?.completed) return { ok: false as const, reason: "not_done" };
  if (row.claimed) return { ok: false as const, reason: "claimed" };
  await prisma.questProgress.update({
    where: { id: row.id },
    data: { claimed: true },
  });
  await awardXp(userId, def.rewardXp);
  return { ok: true as const, rewardXp: def.rewardXp };
}
