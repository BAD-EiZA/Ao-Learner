import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { claimQuest, getDailyQuests } from "@/lib/learning/quests";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const quests = await getDailyQuests(user.id);
  return NextResponse.json({ quests });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const code = String(body.questCode ?? body.code ?? "");
  if (!code) {
    return NextResponse.json({ error: "questCode required" }, { status: 400 });
  }
  const result = await claimQuest(user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json(result);
}
