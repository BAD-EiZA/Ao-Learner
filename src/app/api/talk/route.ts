import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { aoConversation, type TalkTurn } from "@/lib/ai/talk";
import {
  consumeTalkChat,
  getTalkQuota,
  refundTalkChat,
  TALK_DAILY_LIMIT,
} from "@/lib/learning/talk-quota";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    const user = await requireUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const quota = await getTalkQuota(user.id);
    return NextResponse.json(quota);
  } catch (e) {
    console.error("[api/talk GET]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Quota failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userMessage = String(body.message ?? "").trim().slice(0, 500);
    if (!userMessage)
      return NextResponse.json({ error: "message required" }, { status: 400 });

    const language =
      body.language === "French" || body.language === "fr"
        ? ("French" as const)
        : body.language === "German" || body.language === "de"
          ? ("German" as const)
          : ("English" as const);
    const history = (
      Array.isArray(body.history) ? body.history : []
    ) as TalkTurn[];

    let quota;
    try {
      quota = await consumeTalkChat(user.id);
    } catch (e) {
      console.error("[api/talk quota]", e);
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Could not check daily chat limit",
        },
        { status: 500 }
      );
    }

    if (!quota) {
      return NextResponse.json(
        {
          error: `Daily limit reached (${TALK_DAILY_LIMIT} chats). Come back tomorrow.`,
          limit: TALK_DAILY_LIMIT,
          remaining: 0,
          used: TALK_DAILY_LIMIT,
        },
        { status: 429 }
      );
    }

    try {
      const result = await aoConversation({
        language,
        history,
        userMessage,
        level: String(body.level ?? "A1"),
      });
      return NextResponse.json({ ...result, ...quota });
    } catch (e) {
      console.error("[api/talk gemini]", e);
      // don't burn quota on AI failure
      try {
        await refundTalkChat(user.id);
      } catch {
        /* non-fatal */
      }
      const msg = e instanceof Error ? e.message : "Talk failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } catch (e) {
    console.error("[api/talk POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Talk failed" },
      { status: 500 }
    );
  }
}
