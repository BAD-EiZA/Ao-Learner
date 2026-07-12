import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  computePlacementLevel,
  getPlacementStatus,
  PLACEMENT_PROMPTS,
  savePlacement,
} from "@/lib/learning/placement";
import type { CefrLevel, Language } from "@/generated/prisma/client";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = await getPlacementStatus(user.id);
  return NextResponse.json({
    ...status,
    prompts: {
      ENGLISH: PLACEMENT_PROMPTS.ENGLISH,
      GERMAN: PLACEMENT_PROMPTS.GERMAN,
    },
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    language?: Language;
    scores?: number[];
    skip?: boolean;
  };

  if (body.skip) {
    await savePlacement(user.id, "A1", body.language ?? "ENGLISH");
    return NextResponse.json({ level: "A1", skipped: true });
  }

  const scores = body.scores ?? [];
  const level = computePlacementLevel(scores) as CefrLevel;
  const language = (body.language ?? "ENGLISH") as Language;
  await savePlacement(user.id, level, language);

  return NextResponse.json({ level, scores, language });
}
