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
import { NeoBadge, NeoButton, NeoChip, NeoPanel } from "@/components/ui/neo";
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

  const idleAnim = VRM_ANIMS.LookAround;
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
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState<number | null>(null);
  /** Listen-first: must hear tutor before first record per turn */
  const [heardTurn, setHeardTurn] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const karaokeRaf = useRef<number | null>(null);

  // reset listen gate when turn changes
  useEffect(() => {
    setHeardTurn(false);
  }, [turnIndex, stage.id]);

  useEffect(() => {
    try {
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
      if (typeof data.combo === "number") setCombo(data.combo);
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

  return (
    <motion.div
      className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
    >
      <NeoPanel tone="white" className="bg-neo-white">
        <div className="h-[30vh] min-h-[160px] sm:h-[42vh] sm:min-h-[260px] lg:h-[min(70vh,640px)]">
          <AvatarViewer
            emotion={emotion}
            animationUrl={anim.url}
            mouthOpen={mouthOpen}
            autoRotate={false}
            loopAnimation={loopAnim}
            fadeDuration={0.75}
            onAnimationFinished={returnToIdle}
            backgroundColor="#F4CEFF"
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
          <div className="flex flex-wrap gap-2">
            <NeoBadge tone="purple">
              {stage.cefrLevel || "A1"} · Stage {stage.order}
            </NeoBadge>
            <NeoBadge tone="white">Pass ≥ {threshold}</NeoBadge>
            {isDaily && <NeoBadge tone="pink">Daily</NeoBadge>}
            {isReview && <NeoBadge tone="orange">Review</NeoBadge>}
            {isShadow && <NeoBadge tone="cyan">Shadow</NeoBadge>}
            {isStory && <NeoBadge tone="purple">Story</NeoBadge>}
            {isDialogue && (
              <NeoBadge tone="cyan">
                {isStory ? "Story" : "Dialogue"}{" "}
                {Math.min(turnIndex + 1, turns.length)}/{turns.length}
              </NeoBadge>
            )}
            {xpGain > 0 && <NeoBadge tone="lime">+{xpGain} XP</NeoBadge>}
            {combo > 1 && <NeoBadge tone="orange">Combo ×{combo}</NeoBadge>}
            {hearts != null && (
              <NeoBadge tone="pink">{"❤️".repeat(Math.min(5, hearts))}</NeoBadge>
            )}
            {!heardTurn && !completed && !dialogueDone && (
              <NeoBadge tone="orange">Listen first</NeoBadge>
            )}
            {hardMode && <NeoBadge tone="ink">Hard</NeoBadge>}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neo-ink sm:text-4xl">
            {stage.title}
          </h1>
          <p className="text-sm font-medium text-neo-muted">
            {stage.description}
          </p>
          <div className="neo-border neo-shadow rounded-2xl bg-neo-yellow px-3 py-3 text-sm font-bold text-neo-ink">
            {currentTurn.prompt ? (
              <p className="mb-1 text-xs font-black uppercase opacity-80">
                {currentTurn.prompt}
              </p>
            ) : null}
            {dialogueDone ? (
              <p className="text-base font-black">✓ Dialogue complete</p>
            ) : (
              <KaraokePhrase
                text={currentTurn.expectedText}
                progress={karaokeProgress}
              />
            )}
            {!dialogueDone &&
            currentTurn.meaningId &&
            (!hardMode || attemptNum >= 2) ? (
              <p className="mt-1.5 text-xs font-bold opacity-80">
                Meaning (ID):{" "}
                <span className="font-black">{currentTurn.meaningId}</span>
              </p>
            ) : null}
            {hardMode && !dialogueDone && attemptNum < 2 && (
              <p className="mt-1.5 text-[10px] font-black uppercase opacity-70">
                Hard · meaning hidden until attempt 2
              </p>
            )}
            {/* Adaptive hint ladder */}
            {!dialogueDone && attemptNum >= 2 && !hardMode && (
              <p className="mt-2 text-xs font-black opacity-90">
                Hint: listen at 0.75x · meaning above
              </p>
            )}
            {!dialogueDone && attemptNum >= 3 && (
              <p className="mt-1 font-mono text-xs font-bold opacity-90">
                {syllables}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleHard}
            className={`neo-border neo-shadow-sm min-h-11 rounded-xl px-3 py-2 text-xs font-black uppercase ${
              hardMode ? "bg-neo-ink text-neo-white" : "bg-neo-white"
            }`}
          >
            Hard {hardMode ? "ON" : "OFF"}
          </button>
          <span className="text-[10px] font-bold text-neo-muted">
            FB: {app?.locale === "id" ? "ID" : "EN"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDaily && !isDialogue && (
            <NeoChip tone="white">
              Attempts {attemptsLeft}/{MAX_ATTEMPTS}
            </NeoChip>
          )}
          {(completed || dialogueDone) && (
            <NeoChip tone="lime">Completed</NeoChip>
          )}
          <NeoChip tone="cyan">{anim.key}</NeoChip>
        </div>

        {/* Slow-mo tutor speed */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase text-neo-muted">
            Tutor speed
          </span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setPlaybackRate(s)}
              className={`neo-border neo-shadow-sm neo-press min-h-11 min-w-11 rounded-xl px-3 py-2 text-xs font-black ${
                playbackRate === s
                  ? "bg-neo-ink text-neo-white"
                  : "bg-neo-white text-neo-ink"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {!isDaily && !isDialogue && (
          <CooldownTimer
            until={cooldownUntil}
            onExpire={() => {
              setCooldownUntil(null);
              setAttemptsLeft(MAX_ATTEMPTS);
              returnToIdle();
              router.refresh();
            }}
          />
        )}

        {!heardTurn && !completed && !dialogueDone && (
          <div className="neo-border rounded-xl bg-neo-orange/20 px-3 py-2 text-xs font-black text-neo-ink">
            1. Play tutor → 2. Speak. Mic unlocks after you listen.
          </div>
        )}

        {hearts === 0 && (
          <div className="neo-border rounded-xl bg-neo-pink px-3 py-3 text-sm font-bold">
            <p className="font-black">Out of hearts</p>
            <p className="text-xs opacity-80">
              Wait ~30 min to regen, or get Plus for unlimited.
            </p>
            <NeoButton
              tone="ink"
              className="mt-2 text-xs"
              onClick={() => router.push("/plus")}
            >
              Get Plus
            </NeoButton>
          </div>
        )}

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <NeoButton
            type="button"
            onClick={playReference}
            disabled={loading || dialogueDone}
            tone={!heardTurn ? "ink" : "orange"}
            className="w-full sm:w-auto"
          >
            {!heardTurn
              ? "▶ Listen first"
              : isShadow
                ? "Play then shadow"
                : "Play tutor"}{" "}
            {playbackRate !== 1 ? `(${playbackRate}x)` : ""}
          </NeoButton>
          <div className="flex flex-1 justify-center sm:justify-end">
            <RecordButton
              disabled={
                loading ||
                locked ||
                completed ||
                dialogueDone ||
                hearts === 0 ||
                (!heardTurn && !isReview)
              }
              onRecorded={onRecorded}
            />
          </div>
        </div>
        {isShadow && (
          <p className="text-xs font-bold text-neo-muted">
            Shadow mode: play the tutor, then speak along — practice scoring
            with lighter cooldown.
          </p>
        )}
        {isStory && (
          <p className="text-xs font-bold text-neo-muted">
            Story mode: speak each line in order to finish the scene.
          </p>
        )}
        {isStory && dialogueDone && (
          <StoryQuiz turns={turns} />
        )}

        {lastUserBlob && (
          <NeoButton
            type="button"
            tone="white"
            className="w-full sm:w-auto"
            onClick={() => setShowCompare((v) => !v)}
          >
            {showCompare ? "Hide compare" : "Compare audio"}
          </NeoButton>
        )}
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
          combo={combo}
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

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {prevStageId && !isDaily ? (
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
          ) : completed || dialogueDone || isDaily ? (
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
