"use client";

import { AnimatePresence, motion } from "framer-motion";
import { NeoCard } from "@/components/ui/neo";
import { heatClass, type WordHeat } from "@/lib/learning/word-heat";

export type BreakdownView = {
  sounds: number;
  completeness: number;
  stress: number;
  clarity: number;
};

type Props = {
  score?: number | null;
  feedback?: string | null;
  isCorrect?: boolean | null;
  loading?: boolean;
  breakdown?: BreakdownView | null;
  wordHeat?: WordHeat[] | null;
};

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs font-black uppercase">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neo-white/60">
        <div
          className="h-full bg-neo-ink transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function FeedbackPanel({
  score,
  feedback,
  isCorrect,
  loading,
  breakdown,
  wordHeat,
}: Props) {
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <NeoCard tone="info" hover={false} className="font-bold">
            Evaluating pronunciation…
          </NeoCard>
        </motion.div>
      ) : score != null || feedback ? (
        <motion.div
          key="result"
          role={score == null ? "alert" : "status"}
          aria-live={score == null ? "assertive" : "polite"}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
        >
          <NeoCard
            tone={isCorrect ? "success" : "danger"}
            hover={false}
            className="space-y-2 text-sm"
          >
            {score != null && (
              <p className="mb-1 text-2xl font-black">
                Score: {score}
                <span className="text-sm font-bold opacity-70"> / 100</span>
              </p>
            )}
            {wordHeat && wordHeat.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {wordHeat.map((w, i) => (
                  <span
                    key={`${w.word}-${i}`}
                    title={`${w.score}`}
                    className={`neo-border rounded-lg px-2 py-0.5 text-xs font-black ${heatClass(w.score)}`}
                  >
                    {w.word}
                    <span className="ml-1 opacity-70">{w.score}</span>
                  </span>
                ))}
              </div>
            )}
            {breakdown && (
              <div className="grid gap-1.5">
                <Bar label="Sounds" value={breakdown.sounds} />
                <Bar label="Words" value={breakdown.completeness} />
                <Bar label="Stress" value={breakdown.stress} />
                <Bar label="Clarity" value={breakdown.clarity} />
              </div>
            )}
            {feedback && (
              <p className="font-medium leading-relaxed">{feedback}</p>
            )}
          </NeoCard>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
