"use client";

import { NeoCard } from "@/components/ui/neo";
import type { AoMood } from "@/lib/learning/mood";

const COPY: Record<AoMood, { title: string; body: string; tone: "lime" | "cyan" | "orange" | "purple" }> = {
  happy: {
    title: "Ao is happy",
    body: "Your streak looks solid. Keep the momentum!",
    tone: "lime",
  },
  proud: {
    title: "Ao is impressed",
    body: "Strong passes in a row — you're on fire.",
    tone: "purple",
  },
  concerned: {
    title: "Ao misses you",
    body: "A 5-minute drill today protects your streak.",
    tone: "orange",
  },
  neutral: {
    title: "Ao is ready",
    body: "Whenever you are — let's speak.",
    tone: "cyan",
  },
};

export function AoMoodBanner({ mood }: { mood: AoMood }) {
  const c = COPY[mood] ?? COPY.neutral;
  return (
    <NeoCard tone={c.tone} hover={false} className="flex flex-wrap items-center gap-3">
      <span className="text-3xl" aria-hidden>
        {mood === "proud" ? "🌟" : mood === "happy" ? "😊" : mood === "concerned" ? "💭" : "🙂"}
      </span>
      <div>
        <p className="font-black">{c.title}</p>
        <p className="text-sm font-medium opacity-90">{c.body}</p>
      </div>
    </NeoCard>
  );
}
