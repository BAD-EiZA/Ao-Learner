import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  activatePlus,
  getPlusState,
  PLUS_PERKS,
} from "@/lib/learning/plus";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await getPlusState(user.id);
  return NextResponse.json({ ...state, perks: PLUS_PERKS });
}

/** Soft demo activate — no payment */
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const days = Math.min(90, Math.max(1, Number(body.days ?? 30)));
  await activatePlus(user.id, days);
  const state = await getPlusState(user.id);
  return NextResponse.json({ ...state, perks: PLUS_PERKS });
}
