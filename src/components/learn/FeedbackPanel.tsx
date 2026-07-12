"use client";

import { AnimatePresence, motion } from "framer-motion";
import { NeoCard } from "@/components/ui/neo";

type Props = {
  score?: number | null;
  feedback?: string | null;
  isCorrect?: boolean | null;
  loading?: boolean;
};

export function FeedbackPanel({ score, feedback, isCorrect, loading }: Props) {
  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          <NeoCard tone="cyan" hover={false} className="font-bold">
            Evaluating pronunciation…
          </NeoCard>
        </motion.div>
      ) : score != null || feedback ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 24 }}
        >
          <NeoCard
            tone={isCorrect ? "lime" : "pink"}
            hover={false}
            className="text-sm"
          >
            {score != null && (
              <p className="mb-1 text-2xl font-black">
                Score: {score}
                <span className="text-sm font-bold opacity-70"> / 100</span>
              </p>
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
