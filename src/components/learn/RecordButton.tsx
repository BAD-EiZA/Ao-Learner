"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { analyzeBlobQuality } from "@/lib/audio/mic-gate";
import { trackClient } from "@/lib/analytics";
import { useAppOptional } from "@/components/providers/AppProviders";

type Props = {
  disabled?: boolean;
  onRecorded: (blob: Blob) => void;
};

const BARS = 16;

export function RecordButton({ disabled, onRecorded }: Props) {
  const app = useAppOptional();
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: BARS }, () => 0.08)
  );
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const stopWave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => undefined);
      ctxRef.current = null;
    }
    setLevels(Array.from({ length: BARS }, () => 0.08));
  }, []);

  useEffect(() => {
    return () => {
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
      stopWave();
    };
  }, [stopWave]);

  const startWave = useCallback(
    (stream: MediaStream) => {
      stopWave();
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next: number[] = [];
        const step = Math.floor(data.length / BARS) || 1;
        for (let i = 0; i < BARS; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
          next.push(Math.min(1, (sum / step / 255) * 1.8 + 0.08));
        }
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [stopWave]
  );

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        void (async () => {
          const blob = new Blob(chunks.current, { type: mime });
          stream.getTracks().forEach((t) => t.stop());
          stopWave();

          const quality = await analyzeBlobQuality(blob);
          if (!quality.ok) {
            trackClient("mic_rejected", { reason: quality.reason });
            const msg =
              quality.reason === "quiet"
                ? app?.tr("error_mic_quiet") ??
                  "Too quiet — speak louder and try again."
                : quality.reason === "noise"
                  ? app?.tr("error_mic_noise") ??
                    "Too noisy — move somewhere quieter."
                  : quality.reason === "short"
                    ? "Recording too short — hold a bit longer."
                    : app?.tr("error_mic") ?? "Microphone issue.";
            setError(msg);
            return;
          }
          onRecorded(blob);
        })();
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
      startWave(stream);
    } catch {
      setError(
        app?.tr("error_mic") ??
          "Microphone permission denied or unavailable."
      );
    }
  }, [onRecorded, startWave, stopWave, app]);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Compact side bars — does not sit above mic */}
      <div
        className="pointer-events-none absolute bottom-1/2 left-1/2 z-0 flex h-10 w-[min(100vw-8rem,16rem)] -translate-x-1/2 translate-y-2 items-end justify-center gap-0.5 opacity-90"
        aria-hidden
      >
        {levels.map((lv, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-neo-ink/80"
            animate={{ height: `${Math.max(8, lv * 36)}px` }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          />
        ))}
      </div>

      <motion.button
        type="button"
        disabled={disabled}
        onClick={recording ? stop : start}
        className={cn(
          "neo-border neo-shadow relative z-10 flex h-16 w-16 items-center justify-center rounded-full text-xs font-black uppercase sm:h-[4.5rem] sm:w-[4.5rem] sm:text-sm",
          recording ? "bg-neo-pink text-neo-ink" : "bg-neo-ink text-neo-white",
          disabled && "pointer-events-none opacity-50"
        )}
        animate={
          recording
            ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  "4px 4px 0 #1B4EF5",
                  "6px 6px 0 #1B4EF5",
                  "4px 4px 0 #1B4EF5",
                ],
              }
            : { scale: 1 }
        }
        transition={
          recording
            ? { repeat: Infinity, duration: 0.9, ease: "easeInOut" }
            : { type: "spring", stiffness: 400, damping: 22 }
        }
        whileHover={!disabled && !recording ? { y: -2 } : undefined}
        whileTap={
          !disabled
            ? { x: 3, y: 3, boxShadow: "1px 1px 0 #1B4EF5" }
            : undefined
        }
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {recording ? "STOP" : "REC"}
      </motion.button>
      <p className="relative z-10 mt-1 text-[10px] font-bold text-neo-ink drop-shadow-[0_1px_0_#fff] sm:text-xs">
        {recording
          ? app?.tr("rec_listening") ?? "Listening… tap to stop"
          : app?.tr("rec_tap") ?? "Tap to speak"}
      </p>
      {error && (
        <p className="neo-border relative z-10 mt-1 rounded-lg bg-neo-pink px-2 py-1 text-center text-[10px] font-bold">
          {error}
        </p>
      )}
    </div>
  );
}
