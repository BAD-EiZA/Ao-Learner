import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { getHeartsState } from "@/lib/learning/hearts";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const state = await getHeartsState(user.id);
  return NextResponse.json(state);
}
