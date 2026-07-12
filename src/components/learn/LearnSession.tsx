"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AvatarViewer } from "@/components/vrm/AvatarViewer";
import { RecordButton } from "@/components/learn/RecordButton";
import { FeedbackPanel } from "@/components/learn/FeedbackPanel";
import { CooldownTimer } from "@/components/learn/CooldownTimer";
import type { Emotion } from "@/lib/constants";
import { MAX_ATTEMPTS, PASS_SCORE } from "@/lib/constants";
import { pickAnimForScore, VRM_ANIMS, type AnimDef } from "@/lib/vrm/anims";
import { resolvePlayableAudioUrl } from "@/lib/audio/client";
import { NeoBadge, NeoButton, NeoChip, NeoPanel } from "@/components/ui/neo";
import type { StageView } from "@/types/stage";

export function LearnSession({
  stage,
  prevStageId = null,
  nextStageId = null,
}: {
  stage: StageView;
  prevStageId?: string | null;
  nextStageId?: string | null;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const blobRevokeRef = useRef<(() => void) | null>(null);

  const idleAnim = VRM_ANIMS.LookAround;
  const evalAnim = VRM_ANIMS.Thinking;
  const [anim, setAnim] = useState<AnimDef>(idleAnim);
  const [emotion, setEmotion] = useState<Emotion>(idleAnim.emotion);
  const [loopAnim, setLoopAnim] = useState(true);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState<number | null>(stage.bestScore);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    stage.isCompleted ? true : null
  );
  const [attemptsLeft, setAttemptsLeft] = useState(stage.attemptsLeft);
  const [cooldownUntil, setCooldownUntil] = useState(stage.cooldownUntil);
  const [completed, setCompleted] = useState(stage.isCompleted);
  const [now, setNow] = useState(() => Date.now());

  // Next only when not failed: passed this session or already completed
  const canGoNext =
    !!nextStageId &&
    (completed ||
      isCorrect === true ||
      (score != null && score >= PASS_SCORE));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const stopMouth = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setMouthOpen(0);
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
  }, []);

  const trackMouth = useCallback(
    async (audio: HTMLAudioElement) => {
      // only stop analyser loop / ctx — do not pause the element
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => undefined);
        audioCtxRef.current = null;
      }

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.35;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const freq = new Uint8Array(analyser.frequencyBinCount);
      const time = new Uint8Array(analyser.fftSize);

      const loop = () => {
        analyser.getByteFrequencyData(freq);
        analyser.getByteTimeDomainData(time);

        let fSum = 0;
        const band = Math.min(48, freq.length);
        for (let i = 2; i < band; i++) fSum += freq[i];
        const fAvg = fSum / (band - 2) / 255;

        let peak = 0;
        for (let i = 0; i < time.length; i++) {
          const v = Math.abs(time[i] - 128) / 128;
          if (v > peak) peak = v;
        }

        const open = Math.min(1, Math.max(0, fAvg * 2.8 + peak * 1.6));
        setMouthOpen(open > 0.04 ? open : 0);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();

      const end = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setMouthOpen(0);
      };
      audio.addEventListener("ended", end, { once: true });
    },
    []
  );

  const playAudio = useCallback(
    async (src: string, next?: AnimDef) => {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeAttribute("src");
          audioRef.current.load();
        }
        if (blobRevokeRef.current) {
          blobRevokeRef.current();
          blobRevokeRef.current = null;
        }
        stopMouth();

        if (next) {
          setAnim((cur) => (cur.key === next.key ? cur : next));
          setEmotion(next.emotion);
        }

        const resolved = await resolvePlayableAudioUrl(src);
        blobRevokeRef.current = resolved.revoke ?? null;

        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audio.src = resolved.url;
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          const ok = () => {
            cleanup();
            resolve();
          };
          const fail = () => {
            cleanup();
            reject(new Error("Audio decode failed"));
          };
          const cleanup = () => {
            audio.removeEventListener("canplay", ok);
            audio.removeEventListener("error", fail);
          };
          audio.addEventListener("canplay", ok, { once: true });
          audio.addEventListener("error", fail, { once: true });
          audio.load();
          // fallback if event never fires
          setTimeout(ok, 1500);
        });

        // wire lip-sync BEFORE play so first frames capture audio
        await trackMouth(audio);
        await audio.play();
      } catch (e) {
        console.error("playAudio", e);
        setFeedback(
          e instanceof Error
            ? `Could not play audio: ${e.message}`
            : "Could not play audio."
        );
        stopMouth();
      }
    },
    [trackMouth, stopMouth]
  );

  const playReference = useCallback(async () => {
    setFeedback(null);
    setLoopAnim(true);
    // keep idle LookAround while tutor speaks (stable for lip-sync)
    await playAudio(stage.referenceAudio, idleAnim);
  }, [playAudio, stage.referenceAudio, idleAnim]);

  useEffect(() => () => stopMouth(), [stopMouth]);

  const returnToIdle = useCallback(() => {
    // only update state if not already idle (avoid redundant LookAround restart)
    setAnim((cur) => (cur.key === idleAnim.key ? cur : idleAnim));
    setEmotion(idleAnim.emotion);
    setLoopAnim(true);
  }, [idleAnim]);

  const onRecorded = async (blob: Blob) => {
    setLoading(true);
    setFeedback(null);
    setLoopAnim(true);
    // evaluating → Thinking (smooth crossfade via AvatarViewer)
    setAnim(evalAnim);
    setEmotion(evalAnim.emotion);
    stopMouth();
    try {
      const form = new FormData();
      form.append("stageId", stage.id);
      form.append("audio", blob, "speech.webm");
      const res = await fetch("/api/evaluate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (data.cooldownUntil) setCooldownUntil(data.cooldownUntil);
        setFeedback(data.error ?? "Evaluation failed");
        const fail =
          data.error === "cooldown" ? VRM_ANIMS.Goodbye : VRM_ANIMS.Sad;
        setLoopAnim(false);
        setAnim(fail);
        setEmotion(fail.emotion);
        return;
      }

      const picked = pickAnimForScore(data.score, {
        hitLimit: !!data.hitLimit,
        isCorrect: !!data.is_correct,
      });
      setLoopAnim(false);
      setAnim(picked);
      setEmotion(picked.emotion);
      setScore(data.score);
      setFeedback(data.feedback_text);
      setIsCorrect(data.is_correct);
      setAttemptsLeft(data.attemptsLeft ?? attemptsLeft);
      setCompleted(!!data.isCompleted);
      if (data.cooldownUntil) setCooldownUntil(data.cooldownUntil);

      if (data.audio_content) {
        const mime = data.audio_mime || "audio/wav";
        await playAudio(`data:${mime};base64,${data.audio_content}`, picked);
      }

      if (data.is_correct || data.hitLimit) {
        router.refresh();
      }
    } catch {
      setFeedback("Network error. Try again.");
      setLoopAnim(false);
      setAnim(VRM_ANIMS.Angry);
      setEmotion("angry");
    } finally {
      setLoading(false);
    }
  };

  const locked =
    !!cooldownUntil && new Date(cooldownUntil).getTime() > now;

  return (
    <motion.div
      className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <NeoPanel tone="white" className="bg-neo-white">
        <div className="h-[42vh] min-h-[260px] sm:h-[50vh] lg:h-[min(70vh,640px)]">
          <AvatarViewer
            emotion={emotion}
            animationUrl={anim.url}
            mouthOpen={mouthOpen}
            autoRotate={false}
            loopAnimation={loopAnim}
            fadeDuration={0.75}
            onAnimationFinished={returnToIdle}
            backgroundColor="#fff1c9"
            modelY={0.1}
            cameraPosition={[0, 1.4, 1.9]}
            cameraTarget={[0, 1.1, 0]}
            className="h-full w-full"
          />
        </div>
        <p className="border-t-4 border-neo-ink bg-neo-cyan px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-wide text-neo-ink">
          {anim.key} · lip-sync live
        </p>
      </NeoPanel>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <NeoBadge tone="purple">
            Stage {stage.order} · Pass ≥ {PASS_SCORE}
          </NeoBadge>
          <h1 className="text-3xl font-black tracking-tight text-neo-ink sm:text-4xl">
            {stage.title}
          </h1>
          <p className="text-sm font-medium text-neo-muted">
            {stage.description}
          </p>
          <div className="neo-border neo-shadow rounded-2xl bg-neo-yellow px-3 py-3 text-sm font-bold text-neo-ink">
            <p>
              Ucapkan:{" "}
              <span className="text-base font-black">{stage.expectedText}</span>
            </p>
            {stage.meaningId ? (
              <p className="mt-1.5 text-xs font-bold opacity-80">
                Arti (ID):{" "}
                <span className="font-black">{stage.meaningId}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NeoChip tone="white">
            Attempts {attemptsLeft}/{MAX_ATTEMPTS}
          </NeoChip>
          {completed && <NeoChip tone="lime">Completed</NeoChip>}
          <NeoChip tone="cyan">{anim.key}</NeoChip>
        </div>

        <CooldownTimer
          until={cooldownUntil}
          onExpire={() => {
            setCooldownUntil(null);
            setAttemptsLeft(MAX_ATTEMPTS);
            returnToIdle();
            router.refresh();
          }}
        />

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NeoButton
            type="button"
            onClick={playReference}
            disabled={loading}
            tone="orange"
            className="w-full sm:w-auto"
          >
            Play tutor example
          </NeoButton>
          <div className="flex flex-1 justify-center sm:justify-end">
            <RecordButton
              disabled={loading || locked || completed}
              onRecorded={onRecorded}
            />
          </div>
        </div>

        <FeedbackPanel
          loading={loading}
          score={score}
          feedback={feedback}
          isCorrect={isCorrect}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {prevStageId ? (
            <NeoButton
              type="button"
              tone="white"
              className="w-full sm:flex-1"
              onClick={() => router.push(`/learn/${prevStageId}`)}
            >
              ← Prev
            </NeoButton>
          ) : (
            <NeoButton
              type="button"
              tone="white"
              className="w-full sm:flex-1"
              onClick={() => router.push("/dashboard")}
            >
              ← Dashboard
            </NeoButton>
          )}

          {canGoNext ? (
            <NeoButton
              type="button"
              tone="lime"
              className="w-full sm:flex-1"
              onClick={() => router.push(`/learn/${nextStageId}`)}
            >
              Next →
            </NeoButton>
          ) : completed ? (
            <NeoButton
              type="button"
              tone="lime"
              className="w-full sm:flex-1"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </NeoButton>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
