import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { getGems } from "@/lib/learning/gems";
import {
  SHOP_ITEMS,
  buyShopItem,
  claimPathChest,
} from "@/lib/learning/shop";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gems = await getGems(user.id);
  const stats = await prisma.userStats.findUnique({ where: { userId: user.id } });
  const completed = await prisma.userProgress.count({
    where: { userId: user.id, isCompleted: true },
  });
  return NextResponse.json({
    gems,
    items: SHOP_ITEMS,
    chestsClaimed: stats?.chestsClaimed ?? 0,
    chestsUnlocked: Math.floor(completed / 5),
    streakFreezes: stats?.streakFreezes ?? 0,
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "chest") {
    const r = await claimPathChest(user.id, Number(body.index ?? 0));
    if (!r.ok)
      return NextResponse.json({ error: r.reason }, { status: 400 });
    return NextResponse.json(r);
  }
  const r = await buyShopItem(user.id, String(body.itemId ?? ""));
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}
