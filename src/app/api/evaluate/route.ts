import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";
import {
  applyAttempt,
  clearExpiredCooldown,
  getStageForUser,
  isOnCooldown,
} from "@/lib/db/progress";
import { evaluateSpeech } from "@/lib/ai/gemini";
import { MAX_ATTEMPTS } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const stageId = String(form.get("stageId") ?? "");
    const file = form.get("audio");

    if (!stageId || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "stageId and audio required" },
        { status: 400 }
      );
    }

    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const access = await getStageForUser(user.id, stageId);
    if (!access?.unlocked) {
      return NextResponse.json({ error: "Stage locked" }, { status: 403 });
    }

    await clearExpiredCooldown(user.id, stageId);
    const refreshed = await getStageForUser(user.id, stageId);
    if (refreshed?.cooldownActive) {
      return NextResponse.json(
        {
          error: "cooldown",
          cooldownUntil: refreshed.cooldownUntil,
        },
        { status: 429 }
      );
    }

    if ((refreshed?.attemptsCount ?? 0) >= MAX_ATTEMPTS && !refreshed?.isCompleted) {
      return NextResponse.json(
        { error: "No attempts left" },
        { status: 429 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const audioBase64 = buffer.toString("base64");
    const mimeType = file.type || "audio/webm";

    const evaluation = await evaluateSpeech({
      audioBase64,
      mimeType,
      expectedText: stage.expectedText,
      language: stage.language === "ENGLISH" ? "English" : "German",
    });

    const result = await applyAttempt({
      userId: user.id,
      stageId,
      score: evaluation.score,
    });

    if ("error" in result && result.error === "cooldown") {
      return NextResponse.json(
        {
          error: "cooldown",
          cooldownUntil: result.progress?.cooldownUntil?.toISOString() ?? null,
        },
        { status: 429 }
      );
    }

    const progress = result.progress;
    const hitLimit =
      "hitLimit" in result ? result.hitLimit : false;

    return NextResponse.json({
      score: evaluation.score,
      is_correct: result.passed,
      feedback_text: evaluation.feedback_text,
      emotion: evaluation.emotion,
      bone_commands: evaluation.bone_commands,
      audio_content: evaluation.audio_content,
      audio_mime: evaluation.audio_mime,
      attemptsCount: progress.attemptsCount,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - progress.attemptsCount),
      isCompleted: progress.isCompleted,
      cooldownUntil: progress.cooldownUntil?.toISOString() ?? null,
      hitLimit,
      lockedOut: isOnCooldown(progress.cooldownUntil),
    });
  } catch (err) {
    console.error("evaluate error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
