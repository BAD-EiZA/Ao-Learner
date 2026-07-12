import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const learningWhy =
    typeof body.learningWhy === "string" ? body.learningWhy.slice(0, 32) : null;
  const reminderHour =
    typeof body.reminderHour === "number"
      ? Math.max(0, Math.min(23, body.reminderHour))
      : undefined;

  await prisma.userStats.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      learningWhy: learningWhy ?? undefined,
      reminderHour: reminderHour ?? undefined,
    },
    update: {
      ...(learningWhy != null ? { learningWhy } : {}),
      ...(reminderHour != null ? { reminderHour } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
