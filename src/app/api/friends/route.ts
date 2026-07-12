import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  claimFriendQuest,
  ensureFriendCode,
  getFriendQuest,
  linkFriend,
} from "@/lib/learning/friends";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = await ensureFriendCode(user.id);
  const quest = await getFriendQuest(user.id);
  return NextResponse.json({ code, quest });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "claim") {
    const r = await claimFriendQuest(user.id);
    if (!r.ok)
      return NextResponse.json({ error: r.reason }, { status: 400 });
    return NextResponse.json(r);
  }
  const r = await linkFriend(user.id, String(body.code ?? ""));
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}
