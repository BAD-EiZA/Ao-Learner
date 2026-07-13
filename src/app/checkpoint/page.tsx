"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

type Unit = {
  unitKey: string;
  orders: number[];
  stageIds: string[];
  allDone: boolean;
  checkpointPassed: boolean;
};

type QuizItem = {
  stageId: string;
  expectedText: string;
  meaningId: string;
  title: string;
};

export default function CheckpointPage() {
  const [lang, setLang] = useState<"en" | "de" | "fr">("en");
  const [units, setUnits] = useState<Unit[]>([]);
  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);
  const [unitKey, setUnitKey] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [result, setResult] = useState<{ avg: number; passed: boolean } | null>(
    null
  );

  const load = () =>
    fetch(`/api/checkpoint?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => setUnits(d.units ?? []));

  useEffect(() => {
    void load();
  }, [lang]);

  const start = async (uk: string) => {
    setResult(null);
    setScores([]);
    setUnitKey(uk);
    const res = await fetch(`/api/checkpoint?lang=${lang}&unit=${uk}`);
    const d = await res.json();
    setQuiz(d.quiz ?? []);
  };

  const setScore = (idx: number, v: number) => {
    setScores((s) => {
      const n = [...s];
      n[idx] = v;
      return n;
    });
  };

  const submit = async () => {
    if (!unitKey || !quiz) return;
    const filled = quiz.map((_, i) => scores[i] ?? 0);
    const res = await fetch("/api/checkpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lang,
        unitKey,
        scores: filled,
      }),
    });
    const d = await res.json();
    setResult(d);
    setQuiz(null);
    void load();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8">
      <NeoBadge tone="ink">Checkpoint</NeoBadge>
      <h1 className="text-3xl font-black">Unit test</h1>
      <p className="text-sm font-medium text-neo-muted">
        Finish unit stages, then self-score or speak each line in Learn.
      </p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["en", "EN"],
            ["de", "DE"],
            ["fr", "FR"],
          ] as const
        ).map(([code, label]) => (
          <NeoButton
            key={code}
            tone={lang === code ? "ink" : "white"}
            onClick={() => setLang(code)}
          >
            {label}
          </NeoButton>
        ))}
      </div>

      {result && (
        <NeoCard tone={result.passed ? "lime" : "pink"} hover={false}>
          <p className="font-black">
            Avg {result.avg} · {result.passed ? "Passed +50 XP" : "Retry"}
          </p>
        </NeoCard>
      )}

      {!quiz ? (
        <ul className="space-y-2">
          {units.map((u) => (
            <li key={u.unitKey}>
              <NeoCard
                tone={u.checkpointPassed ? "lime" : "white"}
                className="flex justify-between gap-2"
              >
                <div>
                  <p className="font-black">Unit {u.unitKey}</p>
                  <p className="text-xs font-bold opacity-70">
                    Stages {u.orders.join(", ")} ·{" "}
                    {u.allDone ? "ready" : "finish stages first"}
                    {u.checkpointPassed ? " · cleared" : ""}
                  </p>
                </div>
                <NeoButton
                  tone="ink"
                  disabled={!u.allDone}
                  onClick={() => start(u.unitKey)}
                >
                  Test
                </NeoButton>
              </NeoCard>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3">
          {quiz.map((q, idx) => (
            <NeoCard key={q.stageId} hover={false}>
              <p className="text-xs font-black uppercase opacity-70">
                {q.title}
              </p>
              <p className="font-black">{q.expectedText}</p>
              <p className="text-xs font-bold">{q.meaningId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/learn/${q.stageId}?review=1`}>
                  <NeoButton tone="orange">Speak</NeoButton>
                </Link>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Score"
                  className="neo-border w-20 rounded-lg px-2 py-1 text-sm font-black"
                  value={scores[idx] ?? ""}
                  onChange={(e) => setScore(idx, Number(e.target.value))}
                />
              </div>
            </NeoCard>
          ))}
          <NeoButton tone="lime" className="w-full" onClick={() => void submit()}>
            Submit checkpoint
          </NeoButton>
          <NeoButton tone="white" onClick={() => setQuiz(null)}>
            Cancel
          </NeoButton>
        </div>
      )}

      <Link href="/path">
        <NeoButton tone="white">← Path</NeoButton>
      </Link>
    </div>
  );
}
