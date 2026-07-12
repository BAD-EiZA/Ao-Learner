"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RecordButton } from "@/components/learn/RecordButton";
import { NeoBadge, NeoButton, NeoCard, NeoPanel } from "@/components/ui/neo";
import type { Language } from "@/generated/prisma/client";

type Prompt = { expectedText: string; meaningId: string; cefr: string };

export function PlacementWizard({
  english,
  german,
}: {
  english: Prompt[];
  german: Prompt[];
}) {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("ENGLISH");
  const prompts = useMemo(
    () => (lang === "ENGLISH" ? english : german),
    [lang, english, german]
  );
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [doneLevel, setDoneLevel] = useState<string | null>(null);

  const current = prompts[idx];

  const finish = async (finalScores: number[], skip = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          skip
            ? { skip: true, language: lang }
            : { scores: finalScores, language: lang }
        ),
      });
      const data = await res.json();
      setDoneLevel(data.level ?? "A1");
    } finally {
      setLoading(false);
    }
  };

  const onRecorded = async (blob: Blob) => {
    if (!current) return;
    setLoading(true);
    setFeedback(null);
    try {
      const form = new FormData();
      form.append("audio", blob, "speech.webm");
      form.append("expectedText", current.expectedText);
      form.append("placement", "1");
      form.append(
        "language",
        lang === "ENGLISH" ? "English" : "German"
      );
      const res = await fetch("/api/evaluate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Failed");
        return;
      }
      const nextScores = [...scores, data.score as number];
      setScores(nextScores);
      setFeedback(`Score ${data.score}: ${data.feedback_text}`);
      if (idx + 1 >= prompts.length) {
        await finish(nextScores);
      } else {
        setIdx((i) => i + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  if (doneLevel) {
    return (
      <div className="mx-auto max-w-lg px-3 py-8">
        <NeoCard tone="lime" hover={false} className="space-y-4">
          <p className="text-xs font-black uppercase">Placement complete</p>
          <p className="text-3xl font-black">Start at {doneLevel}</p>
          <p className="text-sm font-medium">
            We unlocked earlier CEFR stages so you can jump into the right band.
          </p>
          <NeoButton
            tone="ink"
            className="w-full sm:w-auto"
            onClick={() => router.push("/dashboard")}
          >
            Go to dashboard
          </NeoButton>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-8">
      <NeoBadge tone="pink">Placement test · 5 phrases</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Find your level</h1>
      <p className="text-sm font-medium text-neo-muted">
        Speak a few phrases. We place you in CEFR A1–B1. Or skip to start at A1.
      </p>

      <div className="flex gap-2">
        {(["ENGLISH", "GERMAN"] as Language[]).map((l) => (
          <button
            key={l}
            type="button"
            disabled={scores.length > 0}
            onClick={() => {
              setLang(l);
              setIdx(0);
              setScores([]);
              setFeedback(null);
            }}
            className={`neo-border neo-shadow-sm rounded-xl px-3 py-2 text-xs font-black ${
              lang === l ? "bg-neo-ink text-neo-white" : "bg-neo-white"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {current && (
        <NeoPanel tone="white" className="space-y-4 p-4">
          <p className="text-xs font-black uppercase opacity-70">
            {idx + 1}/{prompts.length} · {current.cefr}
          </p>
          <p className="text-2xl font-black">{current.expectedText}</p>
          <p className="text-sm font-bold opacity-80">= {current.meaningId}</p>
          <RecordButton disabled={loading} onRecorded={onRecorded} />
          {feedback && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-bold"
            >
              {feedback}
            </motion.p>
          )}
        </NeoPanel>
      )}

      <NeoButton
        type="button"
        tone="white"
        disabled={loading}
        onClick={() => finish([], true)}
      >
        Skip · start at A1
      </NeoButton>
    </div>
  );
}
