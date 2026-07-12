import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  claimStreakMilestone,
  getStreakSociety,
} from "@/lib/learning/streak-society";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await getStreakSociety(user.id);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const r = await claimStreakMilestone(user.id, Number(body.days ?? 0));
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}
