import { prisma } from "@/lib/db/prisma";
import { MAX_HEARTS } from "@/lib/learning/hearts";

/** Soft monetization — toggle Plus for demo / promo */
export async function activatePlus(userId: string, days = 30) {
  const until = new Date();
  until.setUTCDate(until.getUTCDate() + days);
  return prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      isPlus: true,
      plusUntil: until,
      hearts: MAX_HEARTS,
      streakFreezes: 3,
    },
    update: {
      isPlus: true,
      plusUntil: until,
      hearts: MAX_HEARTS,
      streakFreezes: { increment: 2 },
    },
  });
}

export async function getPlusState(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  if (!s) return { isPlus: false, plusUntil: null as string | null };
  const active = s.isPlus && (!s.plusUntil || s.plusUntil > new Date());
  if (s.isPlus && s.plusUntil && s.plusUntil <= new Date()) {
    await prisma.userStats.update({
      where: { userId },
      data: { isPlus: false },
    });
    return { isPlus: false, plusUntil: null };
  }
  return {
    isPlus: active,
    plusUntil: s.plusUntil?.toISOString() ?? null,
  };
}

export const PLUS_PERKS = [
  "Unlimited hearts",
  "30-min cooldowns (not 3h)",
  "Extra streak freezes",
  "Stories & role-play packs",
  "No heart gates on fail",
] as const;
