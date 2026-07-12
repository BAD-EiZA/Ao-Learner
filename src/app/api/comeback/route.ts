import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { claimComeback, getComebackState } from "@/lib/learning/comeback";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const state = await getComebackState(user.id);
  // also surface pending
  return NextResponse.json(state);
}

export async function POST() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await claimComeback(user.id);
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}
