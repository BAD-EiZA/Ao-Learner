import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { getUserAchievements } from "@/lib/learning/achievements";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getUserAchievements(user.id);
  return NextResponse.json({ items });
}
