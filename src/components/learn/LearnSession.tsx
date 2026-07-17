"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AvatarViewer } from "@/components/vrm/AvatarViewer";
import { RecordButton } from "@/components/learn/RecordButton";
import { FeedbackPanel } from "@/components/learn/FeedbackPanel";
import { CooldownTimer } from "@/components/learn/CooldownTimer";
import { ShareCard } from "@/components/learn/ShareCard";
import { KaraokePhrase } from "@/components/learn/KaraokePhrase";
import { SessionRecap } from "@/components/learn/SessionRecap";
import { CompareWaveform } from "@/components/learn/CompareWaveform";
import type { Emotion } from "@/lib/constants";
import { MAX_ATTEMPTS, PASS_SCORE } from "@/lib/constants";
import { pickAnimForScore, VRM_ANIMS, type AnimDef } from "@/lib/vrm/anims";
import { resolvePlayableAudioUrl } from "@/lib/audio/client";
import { NeoBadge, NeoButton } from "@/components/ui/neo";
import type { StageTurn, StageView } from "@/types/stage";
import { trackClient } from "@/lib/analytics";
import { useAppOptional } from "@/components/providers/AppProviders";
import {
  blobToBase64,
  enqueueAttempt,
  savePrefetch,
} from "@/lib/offline/queue";
import { StoryQuiz } from "@/components/learn/StoryQuiz";

const SPEEDS = [1, 0.75, 0.5] as const;
const HARD_KEY = "ao_hard_mode";

export function LearnSession({
  stage,
  prevStageId = null,
  nextStageId = null,
  isDaily = false,
  isReview = false,
  isShadow = false,
  passThreshold = PASS_SCORE,
}: {
  stage: StageView;
  prevStageId?: string | null;
  nextStageId?: string | null;
  isDaily?: boolean;
  isReview?: boolean;
  isShadow?: boolean;
  passThreshold?: number;
}) {
  const router = useRouter();
  const app = useAppOptional();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const blobRevokeRef = useRef<(() => void) | null>(null);

  const isStory = stage.mode === "STORY";
  const isDialogue =
    (stage.mode === "DIALOGUE" ||
      stage.mode === "ROLEPLAY" ||
      stage.mode === "STORY") &&
    (stage.turns?.length ?? 0) > 0;
  const turns: StageTurn[] = useMemo(
    () =>
      isDialogue
        ? stage.turns!
        : [
            {
              expectedText: stage.expectedText,
              meaningId: stage.meaningId,
              prompt: isStory ? "Continue the story:" : "Say this phrase:",
            },
          ],
    [isDialogue, isStory, stage]
  );

  const idleAnim = VRM_ANIMS.Idle;
  const evalAnim = VRM_ANIMS.Thinking;
  const [turnIndex, setTurnIndex] = useState(0);
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
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [karaokeProgress, setKaraokeProgress] = useState(0);
  const [xpGain, setXpGain] = useState(0);
  const [threshold, setThreshold] = useState(passThreshold);
  const [now, setNow] = useState(() => Date.now());
  const [showRecap, setShowRecap] = useState(false);
  const [lastUserBlob, setLastUserBlob] = useState<Blob | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [breakdown, setBreakdown] = useState<{
    sounds: number;
    completeness: number;
    stress: number;
    clarity: number;
  } | null>(null);
  const [wordHeat, setWordHeat] = useState<
    { word: string; score: number }[] | null
  >(null);
  const [hearts, setHearts] = useState<number | null>(null);
  /** Listen-first: must hear tutor before first record per turn */
  const [heardTurn, setHeardTurn] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const karaokeRaf = useRef<number | null>(null);

  // reset listen gate when turn changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- each turn requires a fresh listen gate
    setHeardTurn(false);
  }, [turnIndex, stage.id]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only preference hydrates after mount
      setHardMode(localStorage.getItem(HARD_KEY) === "1");
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    // prefetch this stage audio for offline
    if (stage.referenceAudio?.startsWith("http") && "caches" in window) {
      void caches.open("ao-learner-v2").then((c) =>
        c.add(stage.referenceAudio).catch(() => undefined)
      );
    }
    savePrefetch([
      {
        id: stage.id,
        title: stage.title,
        expectedText: stage.expectedText,
        meaningId: stage.meaningId,
        referenceAudio: stage.referenceAudio,
        language: stage.language,
        cefrLevel: stage.cefrLevel,
      },
    ]);
  }, [stage]);

  const toggleHard = () => {
    setHardMode((h) => {
      const next = !h;
      try {
        localStorage.setItem(HARD_KEY, next ? "1" : "0");
      } catch {
        /* */
      }
      return next;
    });
  };

  const currentTurn = turns[Math.min(turnIndex, turns.length - 1)]!;
  const dialogueDone = isDialogue && turnIndex >= turns.length;
  const attemptNum = stage.attemptsCount + (loading || score != null ? 1 : 0);

  const canGoNext =
    !isDaily &&
    !isReview &&
    !!nextStageId &&
    (completed ||
      isCorrect === true ||
      (score != null && score >= threshold) ||
      dialogueDone);

  const syllables = useMemo(
    () =>
      currentTurn.expectedText
        .replace(/[?.!,]/g, "")
        .split(/\s+/)
        .join(" · "),
    [currentTurn.expectedText]
  );

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

  const trackMouth = useCallback(async (audio: HTMLAudioElement) => {
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

    audio.addEventListener(
      "ended",
      () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setMouthOpen(0);
      },
      { once: true }
    );
  }, []);

  const playAudio = useCallback(
    async (src: string, next?: AnimDef, rate = playbackRate) => {
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
        audio.playbackRate = rate;
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
          setTimeout(ok, 1500);
        });

        await trackMouth(audio);
        // karaoke progress
        if (karaokeRaf.current) cancelAnimationFrame(karaokeRaf.current);
        setKaraokeProgress(0);
        const tick = () => {
          if (!audio.duration || !Number.isFinite(audio.duration)) {
            karaokeRaf.current = requestAnimationFrame(tick);
            return;
          }
          setKaraokeProgress(
            Math.min(1, audio.currentTime / audio.duration)
          );
          if (!audio.paused && !audio.ended) {
            karaokeRaf.current = requestAnimationFrame(tick);
          }
        };
        audio.addEventListener(
          "ended",
          () => {
            setKaraokeProgress(1);
            if (karaokeRaf.current) cancelAnimationFrame(karaokeRaf.current);
          },
          { once: true }
        );
        await audio.play();
        tick();
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
    [trackMouth, stopMouth, playbackRate]
  );

  const playReference = useCallback(async () => {
    setFeedback(null);
    setLoopAnim(true);
    await playAudio(stage.referenceAudio, idleAnim, playbackRate);
    setHeardTurn(true);
  }, [playAudio, stage.referenceAudio, idleAnim, playbackRate]);

  useEffect(() => () => stopMouth(), [stopMouth]);

  const returnToIdle = useCallback(() => {
    setAnim((cur) => (cur.key === idleAnim.key ? cur : idleAnim));
    setEmotion(idleAnim.emotion);
    setLoopAnim(true);
  }, [idleAnim]);

  const onRecorded = async (blob: Blob) => {
    if (dialogueDone) return;
    if (!heardTurn && !isReview && !completed) {
      setFeedback("Listen first — play the tutor, then speak.");
      return;
    }
    setLastUserBlob(blob);
    setShowCompare(false);
    setLoading(true);
    setFeedback(null);
    setLoopAnim(true);
    // evaluating → Thinking (smooth crossfade via AvatarViewer)
    setAnim(evalAnim);
    setEmotion(evalAnim.emotion);
    stopMouth();
    try {
      // offline → queue
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const b64 = await blobToBase64(blob);
        enqueueAttempt({
          stageId: stage.id,
          expectedText: currentTurn.expectedText,
          audioBase64: b64,
          mimeType: blob.type || "audio/webm",
          flags: {
            daily: isDaily,
            review: isReview,
            shadow: isShadow,
            hard: hardMode,
          },
        });
        setFeedback("Offline — attempt queued. Will sync when online.");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("stageId", stage.id);
      form.append("audio", blob, "speech.webm");
      form.append("expectedText", currentTurn.expectedText);
      if (isDaily || isDialogue || isReview || isShadow)
        form.append("skipCooldown", "1");
      if (isDaily) form.append("daily", "1");
      if (isReview) form.append("review", "1");
      if (isShadow) form.append("shadow", "1");
      if (hardMode) form.append("hard", "1");
      form.append("feedbackLocale", app?.locale === "id" ? "id" : "en");

      const res = await fetch("/api/evaluate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        if (data.cooldownUntil) setCooldownUntil(data.cooldownUntil);
        if (typeof data.hearts === "number") setHearts(data.hearts);
        if (data.error === "no_hearts") {
          setFeedback("Out of hearts. Wait to regen or get Plus.");
          setHearts(0);
          setLoopAnim(false);
          setAnim(VRM_ANIMS.Sad);
          setEmotion("sorrow");
          return;
        }
        setFeedback(data.error ?? "Evaluation failed");
        const fail =
          data.error === "cooldown" ? VRM_ANIMS.Goodbye : VRM_ANIMS.Sad;
        setLoopAnim(false);
        setAnim(fail);
        setEmotion(fail.emotion);
        return;
      }

      if (typeof data.passThreshold === "number") {
        setThreshold(data.passThreshold);
      }
      if (typeof data.xpGain === "number") setXpGain(data.xpGain);
      if (typeof data.hearts === "number") setHearts(data.hearts);
      if (data.breakdown) setBreakdown(data.breakdown);
      if (Array.isArray(data.word_heat)) setWordHeat(data.word_heat);

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
      if (data.cooldownUntil) setCooldownUntil(data.cooldownUntil);

      if (data.audio_content) {
        const mime = data.audio_mime || "audio/wav";
        await playAudio(
          `data:${mime};base64,${data.audio_content}`,
          picked,
          1
        );
      }

      if (isDialogue) {
        if (data.is_correct) {
          if (turnIndex + 1 >= turns.length) {
            setCompleted(true);
            setTurnIndex(turns.length);
          } else {
            setTurnIndex((i) => i + 1);
            setIsCorrect(null);
            setFeedback(
              (data.feedback_text ?? "Nice!") + " Next line — keep going!"
            );
          }
        }
      } else {
        setCompleted(!!data.isCompleted);
      }

      if (data.is_correct || data.hitLimit || isDaily) {
        router.refresh();
      }
      if (data.is_correct || data.hitLimit) {
        setShowRecap(true);
      }
      if (isShadow) trackClient("shadow_start", { stageId: stage.id });
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
    !isDaily &&
    !isDialogue &&
    !!cooldownUntil &&
    new Date(cooldownUntil).getTime() > now;

  const showShare =
    (completed || isCorrect === true || dialogueDone) &&
    score != null &&
    score >= threshold;

  const micDisabled =
    loading ||
    locked ||
    completed ||
    dialogueDone ||
    hearts === 0 ||
    (!heardTurn && !isReview);
  const contextLabel = isDaily
    ? "Daily"
    : isShadow
      ? "Shadow"
      : isStory
        ? "Story"
        : isDialogue
          ? "Dialogue"
          : null;

  return (
    <motion.div
      className="relative mx-auto w-full max-w-5xl px-2 py-2 sm:px-4 sm:py-3"
      aria-busy={loading}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <div className="neo-border neo-shadow relative overflow-hidden rounded-2xl bg-neo-white">
        {/* Full canvas stage */}
        <div className="relative h-[min(82dvh,760px)] min-h-[440px] w-full sm:min-h-[520px]">
          <AvatarViewer
            emotion={emotion}
            animationUrl={anim.url}
            mouthOpen={mouthOpen}
            autoRotate={false}
            loopAnimation={loopAnim}
            fadeDuration={0.65}
            onAnimationFinished={returnToIdle}
            backgroundColor="#F4CEFF"
            modelY={0.12}
            cameraPosition={[0, 1.42, 1.35]}
            cameraTarget={[0, 1.28, 0]}
            className="absolute inset-0 h-full w-full"
          />

          {/* Top: compact chrome — model stays clear in center */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 pt-2 sm:px-3 sm:pt-3">
            <div className="pointer-events-auto flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1">
                  <NeoBadge tone="primary">
                    {isDialogue
                      ? `${Math.min(turnIndex + 1, turns.length)}/${turns.length}`
                      : `${stage.cefrLevel || "A1"} · ${stage.order}`}
                  </NeoBadge>
                  {hearts != null && (
                    <NeoBadge tone="danger">
                      <span aria-hidden>
                        {hearts > 0 ? "❤".repeat(Math.min(5, hearts)) : "0"}
                      </span>
                      <span className="sr-only">{hearts} hearts</span>
                    </NeoBadge>
                  )}
                  {contextLabel && <NeoBadge tone="info">{contextLabel}</NeoBadge>}
                </div>
                <h1 className="mt-1 truncate text-base font-black text-neo-ink drop-shadow-[0_1px_0_#fff] sm:text-lg">
                  {stage.title}
                </h1>
              </div>
              <details className="relative shrink-0">
                <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-xl border-2 border-neo-ink bg-white/95 px-3 text-xs font-black uppercase text-neo-ink shadow-[2px_2px_0_#1B4EF5]">
                  Options
                </summary>
                <div className="absolute right-0 z-30 mt-1 w-56 space-y-3 rounded-xl border-2 border-neo-ink bg-white p-3 shadow-[3px_3px_0_#1B4EF5]">
                  <button
                    type="button"
                    onClick={toggleHard}
                    aria-pressed={hardMode}
                    className={`min-h-11 w-full rounded-lg border-2 border-neo-ink px-2 py-2 text-xs font-black uppercase ${
                      hardMode
                        ? "bg-neo-ink text-neo-white"
                        : "bg-white text-neo-ink"
                    }`}
                  >
                    Hard {hardMode ? "ON" : "OFF"}
                  </button>
                  <fieldset className="space-y-1">
                    <legend className="text-xs font-black uppercase text-neo-ink">
                      Speed
                    </legend>
                    <div className="flex gap-1">
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPlaybackRate(s)}
                          aria-pressed={playbackRate === s}
                          className={`min-h-11 min-w-11 flex-1 rounded-md px-1 py-1 text-xs font-black ${
                            playbackRate === s
                              ? "bg-neo-ink text-neo-white"
                              : "border-2 border-neo-ink text-neo-ink"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {lastUserBlob && (
                    <button
                      type="button"
                      onClick={() => setShowCompare((v) => !v)}
                      aria-pressed={showCompare}
                      className={`min-h-11 w-full rounded-lg border-2 border-neo-ink px-2 py-2 text-xs font-black uppercase ${
                        showCompare
                          ? "bg-neo-ink text-neo-white"
                          : "bg-white text-neo-ink"
                      }`}
                    >
                      Compare
                    </button>
                  )}
                </div>
              </details>
            </div>
          </div>

            {/* Bottom dock: phrase above Listen, mic center */}
            <div className="absolute inset-x-0 bottom-0 z-20 px-2 pb-1.5 pt-1 sm:px-3 sm:pb-2">
            {!isDaily && !isDialogue && cooldownUntil && (
              <div className="mb-1">
                <CooldownTimer
                  until={cooldownUntil}
                  onExpire={() => {
                    setCooldownUntil(null);
                    setAttemptsLeft(MAX_ATTEMPTS);
                    returnToIdle();
                    router.refresh();
                  }}
                />
              </div>
            )}

            {hearts === 0 && (
              <div className="mb-1 rounded-xl border-2 border-neo-ink bg-neo-pink/95 px-2 py-1 text-center text-xs font-bold text-neo-ink">
                Out of hearts ·{" "}
                <button
                  type="button"
                  className="font-black underline"
                  onClick={() => router.push("/plus")}
                >
                  Plus
                </button>
              </div>
            )}

            {/* Phrase card — directly above Listen / mic row */}
              <div className="mb-2 flex justify-center px-1">
              <div className="max-w-md rounded-2xl border-2 border-neo-ink bg-white/95 px-3 py-1.5 text-center shadow-[2px_2px_0_#1B4EF5] backdrop-blur-md sm:px-4 sm:py-2">
                {currentTurn.prompt ? (
                  <p className="mb-0.5 text-xs font-black uppercase text-neo-muted">
                    {currentTurn.prompt}
                  </p>
                ) : null}
                {dialogueDone ? (
                  <p className="text-sm font-black text-neo-ink">✓ Complete</p>
                ) : (
                  <div className="text-sm text-neo-ink sm:text-base">
                    <KaraokePhrase
                      text={currentTurn.expectedText}
                      progress={karaokeProgress}
                    />
                  </div>
                )}
                {!dialogueDone &&
                currentTurn.meaningId &&
                (!hardMode || attemptNum >= 2) ? (
                  <p className="mt-0.5 text-xs font-bold text-neo-muted">
                    {currentTurn.meaningId}
                  </p>
                ) : null}
                {hardMode && !dialogueDone && attemptNum < 2 && (
                  <p className="mt-0.5 text-xs font-black uppercase text-neo-muted">
                    Hard · meaning after attempt 2
                  </p>
                )}
                {!dialogueDone && attemptNum >= 3 && (
                  <p className="mt-0.5 font-mono text-xs font-bold text-neo-ink/70">
                    {syllables}
                  </p>
                )}
              </div>
              </div>

              <ol className="mb-1 flex justify-center gap-2 text-[10px] font-black uppercase text-neo-muted sm:text-xs" aria-label="Langkah latihan">
                <li className={heardTurn ? "text-neo-success" : "text-neo-ink"}>1. Dengar</li>
                <li className={!heardTurn ? "opacity-50" : "text-neo-ink"}>2. Ucapkan</li>
                <li className="opacity-50">3. Skor</li>
              </ol>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <button
                type="button"
                onClick={playReference}
                disabled={loading || dialogueDone}
                className={`min-h-11 min-w-11 justify-self-start rounded-xl border-2 border-neo-ink px-2.5 py-2 text-xs font-black uppercase shadow-[2px_2px_0_#1B4EF5] disabled:opacity-50 sm:px-3 ${
                  !heardTurn
                    ? "bg-neo-ink text-neo-white"
                    : "bg-white text-neo-ink"
                }`}
                >
                 {!heardTurn ? "▶ Dengar" : "▶ Ulangi"}
              </button>

              <div className="relative z-10 flex min-w-0 flex-1 flex-col items-center">
                {!heardTurn && !completed && !dialogueDone && (
                  <p className="mb-0.5 text-xs font-black text-neo-ink drop-shadow-[0_1px_0_#fff]">
                    Dengarkan tutor dulu
                  </p>
                )}
                <RecordButton
                  disabled={micDisabled}
                  onRecorded={onRecorded}
                />
              </div>

              <div aria-hidden />
            </div>

            <div className="mt-1.5 flex gap-2">
              {prevStageId && !isDaily ? (
                <NeoButton
                  type="button"
                  tone="surface"
                  className="flex-1 !py-1.5 text-xs"
                  onClick={() => router.push(`/learn/${prevStageId}`)}
                >
                  ← Prev
                </NeoButton>
              ) : (
                <NeoButton
                  type="button"
                  tone="surface"
                  className="flex-1 !py-1.5 text-xs"
                  onClick={() => router.push("/dashboard")}
                >
                  ← Dash
                </NeoButton>
              )}
              {canGoNext ? (
                <NeoButton
                  type="button"
                  tone="success"
                  className="flex-1 !py-1.5 text-xs"
                  onClick={() => router.push(`/learn/${nextStageId}`)}
                >
                  Next →
                </NeoButton>
              ) : completed || dialogueDone || isDaily ? (
                <NeoButton
                  type="button"
                  tone="success"
                  className="flex-1 !py-1.5 text-xs"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </NeoButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Below-canvas: feedback / extras only when needed */}
      <div className="mx-auto mt-3 flex w-full max-w-xl flex-col gap-3 px-1">
        {isShadow && (
          <p className="text-center text-xs font-bold text-neo-muted">
            Shadow: play tutor, then speak along.
          </p>
        )}
        {isStory && (
          <p className="text-center text-xs font-bold text-neo-muted">
            Story: speak each line in order.
          </p>
        )}
        {isStory && dialogueDone && <StoryQuiz turns={turns} />}
        {showCompare && (
          <CompareWaveform
            tutorUrl={stage.referenceAudio}
            userBlob={lastUserBlob}
          />
        )}
        <FeedbackPanel
          loading={loading}
          score={score}
          feedback={feedback}
          isCorrect={isCorrect}
          breakdown={breakdown}
          wordHeat={wordHeat}
        />
        {showRecap && score != null && (
          <SessionRecap
            score={score}
            xpGain={xpGain}
            passed={!!isCorrect}
            stageTitle={stage.title}
            tip={feedback}
            onContinue={() => setShowRecap(false)}
          />
        )}
        {showShare && score != null && (
          <ShareCard
            stageTitle={stage.title}
            expectedText={stage.expectedText}
            meaningId={stage.meaningId}
            score={score}
            language={stage.language}
          />
        )}
      </div>
    </motion.div>
  );
}
