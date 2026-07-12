import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { aoConversation, type TalkTurn } from "@/lib/ai/talk";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userMessage = String(body.message ?? "").trim().slice(0, 500);
  if (!userMessage)
    return NextResponse.json({ error: "message required" }, { status: 400 });

  const language =
    body.language === "German" || body.language === "de"
      ? ("German" as const)
      : ("English" as const);
  const history = (Array.isArray(body.history) ? body.history : []) as TalkTurn[];

  try {
    const result = await aoConversation({
      language,
      history,
      userMessage,
      level: String(body.level ?? "A1"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Talk failed" },
      { status: 500 }
    );
  }
}
