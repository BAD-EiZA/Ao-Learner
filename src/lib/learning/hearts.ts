import { prisma } from "@/lib/db/prisma";

export const MAX_HEARTS = 5;
/** Minutes to regen 1 heart (non-Plus) */
export const HEART_REGEN_MIN = 30;

export function regenHearts(
  hearts: number,
  heartsUpdatedAt: Date,
  isPlus: boolean
) {
  if (isPlus) {
    return { hearts: MAX_HEARTS, heartsUpdatedAt: new Date() };
  }
  if (hearts >= MAX_HEARTS) {
    return { hearts: MAX_HEARTS, heartsUpdatedAt };
  }
  const elapsed = Date.now() - heartsUpdatedAt.getTime();
  const gained = Math.floor(elapsed / (HEART_REGEN_MIN * 60 * 1000));
  if (gained <= 0) return { hearts, heartsUpdatedAt };
  const next = Math.min(MAX_HEARTS, hearts + gained);
  const usedMs = gained * HEART_REGEN_MIN * 60 * 1000;
  return {
    hearts: next,
    heartsUpdatedAt: new Date(heartsUpdatedAt.getTime() + usedMs),
  };
}

export async function getHeartsState(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) {
    return {
      hearts: MAX_HEARTS,
      max: MAX_HEARTS,
      isPlus: false,
      nextHeartAt: null as string | null,
    };
  }
  const isPlus =
    stats.isPlus && (!stats.plusUntil || stats.plusUntil > new Date());
  const reg = regenHearts(stats.hearts, stats.heartsUpdatedAt, isPlus);
  if (reg.hearts !== stats.hearts) {
    await prisma.userStats.update({
      where: { userId },
      data: {
        hearts: reg.hearts,
        heartsUpdatedAt: reg.heartsUpdatedAt,
      },
    });
  }
  let nextHeartAt: string | null = null;
  if (!isPlus && reg.hearts < MAX_HEARTS) {
    nextHeartAt = new Date(
      reg.heartsUpdatedAt.getTime() + HEART_REGEN_MIN * 60 * 1000
    ).toISOString();
  }
  return {
    hearts: reg.hearts,
    max: MAX_HEARTS,
    isPlus,
    nextHeartAt,
  };
}

/** Returns false if no hearts (blocked). Plus never loses hearts. */
export async function consumeHeart(userId: string): Promise<{
  ok: boolean;
  hearts: number;
}> {
  const state = await getHeartsState(userId);
  if (state.isPlus) return { ok: true, hearts: MAX_HEARTS };
  if (state.hearts <= 0) return { ok: false, hearts: 0 };
  const hearts = state.hearts - 1;
  await prisma.userStats.update({
    where: { userId },
    data: { hearts, heartsUpdatedAt: new Date() },
  });
  return { ok: true, hearts };
}

export async function refillHeartsForPlus(userId: string) {
  await prisma.userStats.update({
    where: { userId },
    data: { hearts: MAX_HEARTS, heartsUpdatedAt: new Date() },
  });
}
