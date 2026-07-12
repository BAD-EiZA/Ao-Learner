"use client";

import { motion } from "framer-motion";

/** Highlight words while audio plays (karaoke-style). */
export function KaraokePhrase({
  text,
  progress,
}: {
  text: string;
  /** 0–1 playback progress */
  progress: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const active = Math.min(
    words.length - 1,
    Math.floor(progress * words.length)
  );

  return (
    <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-base font-black text-neo-ink">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          animate={{
            scale: i === active ? 1.08 : 1,
            opacity: i <= active ? 1 : 0.45,
          }}
          className={
            i === active
              ? "rounded-md bg-neo-pink px-1 neo-border"
              : i < active
                ? "underline decoration-2"
                : ""
          }
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
}
