"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  onRecorded: (blob: Blob) => void;
};

export function RecordButton({ disabled, onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: mime });
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(blob);
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone permission denied or unavailable.");
    }
  }, [onRecorded]);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
    setRecording(false);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <motion.button
        type="button"
        disabled={disabled}
        onClick={recording ? stop : start}
        className={cn(
          "neo-border neo-shadow flex h-20 w-20 items-center justify-center rounded-full text-sm font-black uppercase sm:h-24 sm:w-24",
          recording ? "bg-neo-pink text-neo-ink" : "bg-neo-ink text-neo-yellow",
          disabled && "pointer-events-none opacity-50"
        )}
        animate={
          recording
            ? { scale: [1, 1.08, 1], boxShadow: ["4px 4px 0 #111", "6px 6px 0 #111", "4px 4px 0 #111"] }
            : { scale: 1 }
        }
        transition={
          recording
            ? { repeat: Infinity, duration: 0.9, ease: "easeInOut" }
            : { type: "spring", stiffness: 400, damping: 22 }
        }
        whileHover={!disabled && !recording ? { y: -2 } : undefined}
        whileTap={!disabled ? { x: 3, y: 3, boxShadow: "1px 1px 0 #111" } : undefined}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {recording ? "STOP" : "REC"}
      </motion.button>
      <p className="text-xs font-bold text-neo-muted">
        {recording ? "Listening… tap to stop" : "Tap to speak"}
      </p>
      {error && (
        <p className="neo-border neo-shadow-sm rounded-lg bg-neo-pink px-2 py-1 text-center text-xs font-bold">
          {error}
        </p>
      )}
    </div>
  );
}
