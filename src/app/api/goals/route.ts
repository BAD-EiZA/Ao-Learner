import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  getDailyGoalState,
  setDailyXpGoal,
  XP_GOALS,
} from "@/lib/learning/goals";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await getDailyGoalState(user.id);
  return NextResponse.json({ ...state, options: XP_GOALS });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const goal = Number(body.goal ?? 20);
  await setDailyXpGoal(user.id, goal);
  const state = await getDailyGoalState(user.id);
  return NextResponse.json(state);
}
