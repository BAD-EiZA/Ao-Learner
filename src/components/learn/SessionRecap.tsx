"use client";

import { motion } from "framer-motion";
import { NeoButton, NeoCard } from "@/components/ui/neo";
import { trackClient } from "@/lib/analytics";
import { useEffect } from "react";

export function SessionRecap({
  score,
  xpGain,
  passed,
  stageTitle,
  tip,
  onContinue,
}: {
  score: number;
  xpGain: number;
  passed: boolean;
  stageTitle: string;
  tip?: string | null;
  onContinue: () => void;
}) {
  useEffect(() => {
    trackClient("session_recap_view", { score, xpGain, passed, stageTitle });
  }, [score, xpGain, passed, stageTitle]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <NeoCard tone={passed ? "lime" : "pink"} hover={false} className="space-y-2">
        <p className="text-xs font-black uppercase opacity-70">Session recap</p>
        <p className="text-xl font-black">{stageTitle}</p>
        <div className="flex flex-wrap gap-4 text-sm font-bold">
          <span>Score {score}</span>
          <span>+{xpGain} XP</span>
          <span>{passed ? "Passed" : "Keep practicing"}</span>
        </div>
        {tip ? <p className="text-sm font-medium opacity-90">{tip}</p> : null}
        <NeoButton type="button" tone="ink" onClick={onContinue}>
          Continue
        </NeoButton>
      </NeoCard>
    </motion.div>
  );
}
