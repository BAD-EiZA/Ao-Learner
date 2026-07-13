import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  getCheckpointQuiz,
  getCheckpointStatus,
  submitCheckpoint,
} from "@/lib/learning/checkpoint";
import type { Language } from "@/generated/prisma/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const { parseLangParam } = await import("@/lib/languages");
  const language = parseLangParam(url.searchParams.get("lang")) as Language;
  const unitKey = url.searchParams.get("unit");
  if (unitKey) {
    const quiz = await getCheckpointQuiz(user.id, language, unitKey);
    return NextResponse.json({ quiz });
  }
  const units = await getCheckpointStatus(user.id, language);
  return NextResponse.json({ units });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { parseLangParam } = await import("@/lib/languages");
  const language = parseLangParam(
    String(body.lang ?? body.language ?? "en")
  ) as Language;
  const unitKey = String(body.unitKey ?? "u1");
  const scores = Array.isArray(body.scores)
    ? body.scores.map((n: unknown) => Number(n) || 0)
    : [];
  const result = await submitCheckpoint({
    userId: user.id,
    language,
    unitKey,
    scores,
  });
  return NextResponse.json(result);
}
