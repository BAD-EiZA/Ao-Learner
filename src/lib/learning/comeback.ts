import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/lib/db/streak";
import { awardXp } from "@/lib/learning/xp";
import { awardGems } from "@/lib/learning/gems";
import { MAX_HEARTS } from "@/lib/learning/hearts";

const LAPSE_DAYS = 3;
const BONUS_XP = 40;
const BONUS_GEMS = 20;

function utcDateOnly(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function daysBetween(a: Date, b: Date) {
  const ms = utcDateOnly(b).getTime() - utcDateOnly(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/** Pure: is this a comeback day? */
export function isComebackLapse(lastActive: Date | null, now = new Date()) {
  if (!lastActive) return false;
  return daysBetween(lastActive, now) >= LAPSE_DAYS;
}

export async function getComebackState(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  const daysAway = stats?.lastActiveDate
    ? daysBetween(stats.lastActiveDate, new Date())
    : 0;
  const eligible = daysAway >= LAPSE_DAYS;
  const claimed = await prisma.analyticsEvent.findFirst({
    where: {
      userId,
      name: "comeback_claim",
      createdAt: { gte: utcDateOnly() },
    },
  });
  const pending = await prisma.analyticsEvent.findFirst({
    where: {
      userId,
      name: "comeback_pending",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  const active = !claimed && (eligible || !!pending);
  return {
    eligible: eligible || !!pending,
    active,
    claimedToday: !!claimed,
    daysAway,
  };
}

/** Offer easy path + bonus once when returning after lapse */
export async function claimComeback(userId: string) {
  const state = await getComebackState(userId);
  // also allow if they just returned today and streak reset (lastActive today but we mark on first session)
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return { ok: false as const, reason: "no_stats" };

  // If already claimed today
  if (state.claimedToday) return { ok: false as const, reason: "claimed" };

  // Eligible if daysAway >= 3 OR we stored a pending comeback via recent streak reset with long gap
  // Use event "comeback_pending" set by touchUserActivity
  const pending = await prisma.analyticsEvent.findFirst({
    where: {
      userId,
      name: "comeback_pending",
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!state.eligible && !pending) {
    return { ok: false as const, reason: "not_eligible" };
  }

  await awardXp(userId, BONUS_XP);
  await awardGems(userId, BONUS_GEMS);
  await prisma.userStats.update({
    where: { userId },
    data: {
      hearts: MAX_HEARTS,
      heartsUpdatedAt: new Date(),
    },
  });
  await prisma.analyticsEvent.create({
    data: {
      userId,
      name: "comeback_claim",
      props: { dateKey: todayKey(), xp: BONUS_XP, gems: BONUS_GEMS },
    },
  });

  // easy stages: first unlocked incomplete phrase
  const stages = await prisma.stage.findMany({
    where: { mode: "PHRASE" },
    orderBy: [{ language: "asc" }, { order: "asc" }],
    take: 6,
  });

  return {
    ok: true as const,
    xp: BONUS_XP,
    gems: BONUS_GEMS,
    hearts: MAX_HEARTS,
    easyStageIds: stages.slice(0, 3).map((s) => s.id),
  };
}

/** Call when user returns after long gap — mark pending */
export async function markComebackPending(
  userId: string,
  daysAway: number
) {
  if (daysAway < LAPSE_DAYS) return;
  await prisma.analyticsEvent.create({
    data: {
      userId,
      name: "comeback_pending",
      props: { daysAway },
    },
  });
}

export const COMEBACK = {
  LAPSE_DAYS,
  BONUS_XP,
  BONUS_GEMS,
} as const;
