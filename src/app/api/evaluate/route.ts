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
import { MAX_ATTEMPTS, PASS_SCORE } from "@/lib/constants";
import { getAdaptivePassThreshold } from "@/lib/learning/adaptive";
import { consumeHeart, getHeartsState } from "@/lib/learning/hearts";
import { getPlusState } from "@/lib/learning/plus";

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
    const expectedOverride = form.get("expectedText");
    const skipCooldown = form.get("skipCooldown") === "1";
    const isDaily = form.get("daily") === "1";
    const isReview = form.get("review") === "1";
    const isPlacement = form.get("placement") === "1";
    const isShadow = form.get("shadow") === "1";
    const isHard = form.get("hard") === "1";
    const feedbackLocale =
      form.get("feedbackLocale") === "id" ? ("id" as const) : ("en" as const);

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "audio required" }, { status: 400 });
    }

    // Placement has no stageId — synthetic evaluate only
    if (isPlacement) {
      const expectedText = String(expectedOverride ?? "").trim();
      if (!expectedText) {
        return NextResponse.json(
          { error: "expectedText required for placement" },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const evaluation = await evaluateSpeech({
        audioBase64: buffer.toString("base64"),
        mimeType: file.type || "audio/webm",
        expectedText,
        language: String(form.get("language") || "English"),
        feedbackLocale,
        hardMode: isHard,
      });
      const threshold = isHard ? PASS_SCORE + 10 : PASS_SCORE;
      const passed = evaluation.score >= threshold;
      return NextResponse.json({
        score: evaluation.score,
        is_correct: passed,
        feedback_text: evaluation.feedback_text,
        emotion: evaluation.emotion,
        bone_commands: evaluation.bone_commands,
        audio_content: evaluation.audio_content,
        audio_mime: evaluation.audio_mime,
        breakdown: evaluation.breakdown,
        word_heat: evaluation.word_heat,
        passThreshold: threshold,
        placement: true,
      });
    }

    if (!stageId) {
      return NextResponse.json({ error: "stageId required" }, { status: 400 });
    }

    const stage = await prisma.stage.findUnique({ where: { id: stageId } });
    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const expectedText =
      typeof expectedOverride === "string" && expectedOverride.trim()
        ? expectedOverride.trim()
        : stage.expectedText;

    const plus = await getPlusState(user.id);

    if (!isDaily && !isReview) {
      const access = await getStageForUser(user.id, stageId);
      if (!access?.unlocked) {
        return NextResponse.json({ error: "Stage locked" }, { status: 403 });
      }
      await clearExpiredCooldown(user.id, stageId);
      const refreshed = await getStageForUser(user.id, stageId);
      // Plus: ignore long cooldowns (hard gate perk)
      if (refreshed?.cooldownActive && !skipCooldown && !plus.isPlus) {
        return NextResponse.json(
          {
            error: "cooldown",
            cooldownUntil: refreshed.cooldownUntil,
          },
          { status: 429 }
        );
      }
      if (
        !skipCooldown &&
        !plus.isPlus &&
        (refreshed?.attemptsCount ?? 0) >= MAX_ATTEMPTS &&
        !refreshed?.isCompleted
      ) {
        return NextResponse.json(
          { error: "No attempts left" },
          { status: 429 }
        );
      }
    }

    // Hearts gate (skip for practice modes)
    if (!isDaily && !isReview && !isShadow && !skipCooldown) {
      const hearts = await getHeartsState(user.id);
      if (!hearts.isPlus && hearts.hearts <= 0) {
        return NextResponse.json(
          {
            error: "no_hearts",
            hearts: 0,
            nextHeartAt: hearts.nextHeartAt,
          },
          { status: 429 }
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const evaluation = await evaluateSpeech({
      audioBase64: buffer.toString("base64"),
      mimeType: file.type || "audio/webm",
      expectedText,
      language:
        stage.language === "PORTUGUESE"
          ? "Portuguese"
          : stage.language === "ITALIAN"
            ? "Italian"
            : stage.language === "SPANISH"
              ? "Spanish"
              : stage.language === "FRENCH"
                ? "French"
                : stage.language === "GERMAN"
                  ? "German"
                  : "English",
      feedbackLocale,
      hardMode: isHard,
    });

    const threshold = await getAdaptivePassThreshold(
      user.id,
      stage.cefrLevel,
      isHard
    );
    const adaptivePassed = evaluation.score >= threshold;
    evaluation.is_correct = adaptivePassed;

    // Consume heart on fail (not practice modes)
    let heartsLeft: number | null = null;
    if (
      !adaptivePassed &&
      !isDaily &&
      !isReview &&
      !isShadow &&
      !skipCooldown
    ) {
      const consumed = await consumeHeart(user.id);
      heartsLeft = consumed.hearts;
      if (!consumed.ok) {
        return NextResponse.json(
          { error: "no_hearts", hearts: 0 },
          { status: 429 }
        );
      }
    } else {
      const h = await getHeartsState(user.id);
      heartsLeft = h.hearts;
    }

    const isRoleplay =
      stage.mode === "ROLEPLAY" || stage.mode === "STORY";

    const result = await applyAttempt({
      userId: user.id,
      stageId,
      score: evaluation.score,
      feedback: evaluation.feedback_text,
      skipCooldown:
        skipCooldown || isDaily || isReview || isShadow || plus.isPlus,
      passThreshold: threshold,
      isShadow,
      isRoleplay,
      hardMode: isHard,
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
    const hitLimit = "hitLimit" in result ? result.hitLimit : false;
    const xpGain = "xpGain" in result ? result.xpGain : 0;
    const combo = "combo" in result ? result.combo : 0;

    let feedback = evaluation.feedback_text;
    if (isShadow) {
      feedback = `[Shadow] ${feedback}`;
    }

    return NextResponse.json({
      score: evaluation.score,
      is_correct: adaptivePassed && result.passed,
      feedback_text: feedback,
      emotion: evaluation.emotion,
      bone_commands: evaluation.bone_commands,
      audio_content: evaluation.audio_content,
      audio_mime: evaluation.audio_mime,
      breakdown: evaluation.breakdown,
      word_heat: evaluation.word_heat,
      attemptsCount: progress.attemptsCount,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - progress.attemptsCount),
      isCompleted: progress.isCompleted,
      cooldownUntil: progress.cooldownUntil?.toISOString() ?? null,
      hitLimit,
      lockedOut: isOnCooldown(progress.cooldownUntil),
      passThreshold: threshold,
      xpGain,
      combo,
      hearts: heartsLeft,
    });
  } catch (err) {
    console.error("evaluate error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}
