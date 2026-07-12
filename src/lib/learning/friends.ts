import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";
import { awardXp } from "@/lib/learning/xp";
import { awardGems } from "@/lib/learning/gems";

function code() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function ensureFriendCode(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  if (s?.friendCode) return s.friendCode;
  const c = code();
  await prisma.userStats.upsert({
    where: { userId },
    create: { userId, friendCode: c },
    update: { friendCode: c },
  });
  return c;
}

export async function linkFriend(userId: string, theirCode: string) {
  const other = await prisma.userStats.findFirst({
    where: { friendCode: theirCode.toUpperCase() },
  });
  if (!other || other.userId === userId)
    return { ok: false as const, reason: "not_found" };
  await prisma.userStats.update({
    where: { userId },
    data: { friendOfUserId: other.userId },
  });
  // mutual if empty
  if (!other.friendOfUserId) {
    await prisma.userStats.update({
      where: { userId: other.userId },
      data: { friendOfUserId: userId },
    });
  }
  return { ok: true as const, friendId: other.userId };
}

export async function getFriendQuest(userId: string) {
  const me = await prisma.userStats.findUnique({ where: { userId } });
  if (!me?.friendOfUserId) return null;
  const friend = await prisma.userStats.findUnique({
    where: { userId: me.friendOfUserId },
  });
  const dateKey = todayKey();
  // shared weekly XP goal: both earn 100 weekXp contribution (use dailyXp as proxy)
  const myXp = me.dailyXpDate === dateKey ? me.dailyXpEarned : 0;
  const theirXp =
    friend?.dailyXpDate === dateKey ? friend.dailyXpEarned : 0;
  const target = 50;
  const combined = myXp + theirXp;
  return {
    friendId: me.friendOfUserId,
    myXp,
    theirXp,
    combined,
    target,
    met: combined >= target,
  };
}

export async function claimFriendQuest(userId: string) {
  const q = await getFriendQuest(userId);
  if (!q?.met) return { ok: false as const, reason: "not_met" };
  // simple: award once per day via analytics check
  const { prisma: p } = await import("@/lib/db/prisma");
  const existing = await p.analyticsEvent.findFirst({
    where: {
      userId,
      name: "friend_quest_claim",
      createdAt: { gte: new Date(Date.now() - 20 * 60 * 60 * 1000) },
    },
  });
  if (existing) return { ok: false as const, reason: "claimed" };
  await awardXp(userId, 30);
  await awardGems(userId, 15);
  await p.analyticsEvent.create({
    data: { userId, name: "friend_quest_claim", props: {} },
  });
  return { ok: true as const };
}
