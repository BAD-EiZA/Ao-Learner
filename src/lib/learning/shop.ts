import { prisma } from "@/lib/db/prisma";
import { spendGems, awardGems } from "@/lib/learning/gems";
import { MAX_HEARTS, refillHeartsForPlus } from "@/lib/learning/hearts";
import { activatePlus } from "@/lib/learning/plus";

export const SHOP_ITEMS = [
  {
    id: "freeze",
    name: "Streak freeze",
    cost: 100,
    desc: "+1 freeze charge",
  },
  {
    id: "hearts",
    name: "Refill hearts",
    cost: 80,
    desc: "Full 5 hearts",
  },
  {
    id: "xp_boost",
    name: "Small XP pack",
    cost: 50,
    desc: "+25 XP",
  },
] as const;

export type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];

export async function buyShopItem(userId: string, itemId: string) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false as const, reason: "unknown" };

  const paid = await spendGems(userId, item.cost);
  if (!paid.ok) return { ok: false as const, reason: "gems", gems: paid.gems };

  if (itemId === "freeze") {
    await prisma.userStats.update({
      where: { userId },
      data: { streakFreezes: { increment: 1 } },
    });
  } else if (itemId === "hearts") {
    await prisma.userStats.update({
      where: { userId },
      data: { hearts: MAX_HEARTS, heartsUpdatedAt: new Date() },
    });
  } else if (itemId === "xp_boost") {
    const { awardXp } = await import("@/lib/learning/xp");
    await awardXp(userId, 25);
  }

  return { ok: true as const, gems: paid.gems, item: item.id };
}

export async function claimPathChest(userId: string, chestIndex: number) {
  // chest every 5 completed stages; claim by index 0,1,2...
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  if (!stats) return { ok: false as const, reason: "no_stats" };
  if (chestIndex < 0 || chestIndex >= 20)
    return { ok: false as const, reason: "bad_index" };
  if (stats.chestsClaimed > chestIndex)
    return { ok: false as const, reason: "claimed" };

  const completed = await prisma.userProgress.count({
    where: { userId, isCompleted: true },
  });
  const unlockedChests = Math.floor(completed / 5);
  if (chestIndex >= unlockedChests)
    return { ok: false as const, reason: "locked" };

  // only claim sequential
  if (chestIndex !== stats.chestsClaimed)
    return { ok: false as const, reason: "order" };

  await prisma.userStats.update({
    where: { userId },
    data: { chestsClaimed: { increment: 1 } },
  });
  await awardGems(userId, 30);
  const { awardXp } = await import("@/lib/learning/xp");
  await awardXp(userId, 20);

  return { ok: true as const, gems: 30, xp: 20 };
}

// silence unused import path for types
void refillHeartsForPlus;
void activatePlus;
