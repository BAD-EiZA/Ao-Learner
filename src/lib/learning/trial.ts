import { prisma } from "@/lib/db/prisma";
import { MAX_HEARTS } from "@/lib/learning/hearts";

const TRIAL_HOURS = 48;

export async function getTrialState(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  if (!s) {
    return {
      eligible: true,
      active: false,
      trialUsed: false,
      trialUntil: null as string | null,
    };
  }
  const active =
    !!s.trialUntil && s.trialUntil > new Date() && !s.isPlus;
  // also treat active plus as not needing trial banner
  return {
    eligible: !s.trialUsed && !s.isPlus,
    active: active || (s.isPlus && !!s.plusUntil && s.plusUntil > new Date()),
    trialUsed: s.trialUsed,
    trialUntil: s.trialUntil?.toISOString() ?? null,
    isPlus: s.isPlus,
  };
}

/** Start Super trial once when hearts empty */
export async function startSuperTrial(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  if (!s) return { ok: false as const, reason: "no_stats" };
  if (s.trialUsed) return { ok: false as const, reason: "used" };
  if (s.isPlus) return { ok: false as const, reason: "plus" };

  const until = new Date(Date.now() + TRIAL_HOURS * 60 * 60 * 1000);
  await prisma.userStats.update({
    where: { userId },
    data: {
      trialUsed: true,
      trialUntil: until,
      isPlus: true,
      plusUntil: until,
      hearts: MAX_HEARTS,
      heartsUpdatedAt: new Date(),
      streakFreezes: { increment: 1 },
    },
  });
  return { ok: true as const, until: until.toISOString() };
}

/** Show banner when hearts=0 and eligible */
export async function shouldShowTrialBanner(userId: string) {
  const s = await prisma.userStats.findUnique({ where: { userId } });
  if (!s || s.trialUsed || s.isPlus) return false;
  return s.hearts <= 0;
}
