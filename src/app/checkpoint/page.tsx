"use client";

import { useCallback, useEffect, useState } from "react";
import { NeoBadge, NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

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
  const [lang, setLang] = useState<"en" | "de" | "fr" | "es" | "it" | "pt">(
    "en"
  );
  const [units, setUnits] = useState<Unit[]>([]);
  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);
  const [unitKey, setUnitKey] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [result, setResult] = useState<{ avg: number; passed: boolean } | null>(
    null
  );
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() =>
    fetch(`/api/checkpoint?lang=${lang}`)
      .then((r) => r.json())
      .then((d) => setUnits(d.units ?? []))
      .catch(() => setError("Could not load checkpoints."))
      .finally(() => setBusy(false)), [lang]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async (uk: string) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setScores([]);
    setUnitKey(uk);
    const res = await fetch(`/api/checkpoint?lang=${lang}&unit=${uk}`);
    const d = await res.json();
    if (!res.ok) setError(d.error ?? "Could not start checkpoint.");
    else setQuiz(d.quiz ?? []);
    setBusy(false);
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
    setBusy(true);
    setError(null);
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
    if (!res.ok) {
      setError(d.error ?? "Could not submit checkpoint.");
      setBusy(false);
    } else {
      setResult(d);
      setQuiz(null);
      void load();
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8" aria-busy={busy}>
      <NeoBadge tone="ink">Checkpoint</NeoBadge>
      <h1 className="text-3xl font-black">Unit test</h1>
      <p className="text-sm font-medium text-neo-muted">
        Finish unit stages, then self-score or speak each line in Learn.
      </p>
      <div className="flex flex-wrap gap-2">
        <span id="checkpoint-language-label" className="sr-only">Checkpoint language</span>
        {(
          [
            ["en", "EN"],
            ["de", "DE"],
            ["fr", "FR"],
            ["es", "ES"],
            ["it", "IT"],
            ["pt", "PT"],
          ] as const
        ).map(([code, label]) => (
          <NeoButton
            key={code}
            tone={lang === code ? "primary" : "surface"}
            aria-pressed={lang === code}
            aria-describedby="checkpoint-language-label"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setLang(code);
            }}
          >
            {label}
          </NeoButton>
        ))}
      </div>

      {error && <p role="alert" className="text-sm font-bold text-neo-ink">{error}</p>}

      {result && (
        <NeoCard tone={result.passed ? "success" : "danger"} hover={false} role="status" aria-live="polite">
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
                tone={u.checkpointPassed ? "success" : "surface"}
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
                  tone="primary"
                  disabled={!u.allDone}
                  aria-busy={busy}
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
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <NeoLink href={`/learn/${q.stageId}?review=1`} tone="warning">Speak</NeoLink>
                <fieldset className="flex flex-wrap gap-1">
                  <legend className="mb-1 text-xs font-black">Self score for {q.title}</legend>
                  {[0, 25, 50, 75, 100].map((score) => (
                    <NeoButton
                      key={score}
                      className="min-h-11 px-3 py-2"
                      tone={scores[idx] === score ? "primary" : "surface"}
                      aria-pressed={scores[idx] === score}
                      onClick={() => setScore(idx, score)}
                    >
                      {score}
                    </NeoButton>
                  ))}
                </fieldset>
              </div>
            </NeoCard>
          ))}
          <NeoButton tone="success" className="w-full" disabled={busy} onClick={() => void submit()}>
            Submit checkpoint
          </NeoButton>
          <NeoButton tone="surface" onClick={() => setQuiz(null)}>
            Cancel
          </NeoButton>
        </div>
      )}

      <NeoLink href={`/path?lang=${lang}`} tone="surface">← Path</NeoLink>
    </div>
  );
}
