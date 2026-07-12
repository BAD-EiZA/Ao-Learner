import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  addToWordBank,
  listWordBank,
  removeWordBank,
} from "@/lib/learning/bank";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await listWordBank(user.id);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "remove") {
    await removeWordBank(user.id, String(body.id));
    return NextResponse.json({ ok: true });
  }
  const item = await addToWordBank({
    userId: user.id,
    phrase: String(body.phrase ?? "").slice(0, 200),
    meaningId: String(body.meaningId ?? ""),
    language: body.language === "GERMAN" ? "GERMAN" : "ENGLISH",
    stageId: body.stageId,
  });
  return NextResponse.json({ item });
}
