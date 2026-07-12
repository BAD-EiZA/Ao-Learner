"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { intervalToDuration, isPast } from "date-fns";

function formatRemaining(until: string) {
  const target = new Date(until);
  if (isPast(target)) return "Ready";
  const d = intervalToDuration({ start: new Date(), end: target });
  const h = String(d.hours ?? 0).padStart(2, "0");
  const m = String(d.minutes ?? 0).padStart(2, "0");
  const s = String(d.seconds ?? 0).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function CooldownTimer({
  until,
  onExpire,
}: {
  until: string | null;
  onExpire?: () => void;
}) {
  const [label, setLabel] = useState(() =>
    until ? formatRemaining(until) : ""
  );

  useEffect(() => {
    if (!until) return;

    const id = setInterval(() => {
      const next = formatRemaining(until);
      setLabel(next);
      if (next === "Ready") {
        onExpire?.();
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [until, onExpire]);

  if (!until || !label || label === "Ready") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="neo-border neo-shadow-sm rounded-xl bg-neo-orange px-3 py-2 text-center text-sm font-black text-neo-ink"
    >
      Cooldown:{" "}
      <span className="font-mono text-base tracking-wider">{label}</span>
    </motion.div>
  );
}
