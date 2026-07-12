import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  getTrialState,
  shouldShowTrialBanner,
  startSuperTrial,
} from "@/lib/learning/trial";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const state = await getTrialState(user.id);
  const showBanner = await shouldShowTrialBanner(user.id);
  return NextResponse.json({ ...state, showBanner });
}

export async function POST() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await startSuperTrial(user.id);
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}
