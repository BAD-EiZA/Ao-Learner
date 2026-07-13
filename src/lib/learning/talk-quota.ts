import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";

export const TALK_DAILY_LIMIT = 5;

export type TalkQuota = {
  used: number;
  limit: number;
  remaining: number;
  dateKey: string;
};

async function ensureBucket(userId: string) {
  const key = todayKey();
  // ensure row exists (user row already from requireUser)
  const stats = await prisma.userStats.upsert({
    where: { userId },
    create: { userId, talkChatsDate: key, talkChatsUsed: 0 },
    update: {},
  });
  if (stats.talkChatsDate !== key) {
    return prisma.userStats.update({
      where: { userId },
      data: { talkChatsDate: key, talkChatsUsed: 0 },
    });
  }
  return stats;
}

export async function getTalkQuota(userId: string): Promise<TalkQuota> {
  const key = todayKey();
  const stats = await ensureBucket(userId);
  const used = stats.talkChatsDate === key ? stats.talkChatsUsed : 0;
  const limit = TALK_DAILY_LIMIT;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    dateKey: key,
  };
}

/** Consume 1 chat if under limit. Returns null if blocked. */
export async function consumeTalkChat(
  userId: string
): Promise<TalkQuota | null> {
  const q = await getTalkQuota(userId);
  if (q.remaining <= 0) return null;
  await prisma.userStats.update({
    where: { userId },
    data: { talkChatsUsed: { increment: 1 }, talkChatsDate: q.dateKey },
  });
  const used = q.used + 1;
  return {
    used,
    limit: q.limit,
    remaining: Math.max(0, q.limit - used),
    dateKey: q.dateKey,
  };
}

/** Refund 1 chat (e.g. Gemini failed after consume). */
export async function refundTalkChat(userId: string): Promise<TalkQuota> {
  const q = await getTalkQuota(userId);
  if (q.used <= 0) return q;
  const updated = await prisma.userStats.update({
    where: { userId },
    data: { talkChatsUsed: { decrement: 1 } },
  });
  const used = Math.max(0, updated.talkChatsUsed);
  return {
    used,
    limit: TALK_DAILY_LIMIT,
    remaining: Math.max(0, TALK_DAILY_LIMIT - used),
    dateKey: q.dateKey,
  };
}
