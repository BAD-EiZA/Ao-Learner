"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { languageLabel } from "@/lib/utils";
import type { StageView } from "@/types/stage";
import { CooldownTimer } from "@/components/learn/CooldownTimer";
import { NeoBadge, NeoCard, fadeUp, stagger } from "@/components/ui/neo";

const tones = ["yellow", "cyan", "lime", "pink", "purple", "orange"] as const;

export function StageList({
  language,
  stages,
}: {
  language: "ENGLISH" | "GERMAN";
  stages: StageView[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black uppercase tracking-tight text-neo-ink">
          {languageLabel(language)}
        </h2>
        <NeoBadge tone={language === "ENGLISH" ? "cyan" : "orange"}>
          {stages.length} stages
        </NeoBadge>
      </div>
      <motion.ul
        className="grid gap-4 sm:grid-cols-2"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        {stages.map((s, i) => {
          const locked = !s.unlocked || s.cooldownActive;
          const tone = tones[i % tones.length]!;
          const content = (
            <NeoCard
              tone={
                s.isCompleted
                  ? "lime"
                  : !s.unlocked
                    ? "white"
                    : tone
              }
              hover={s.unlocked && !s.cooldownActive}
              className={!s.unlocked ? "opacity-70 grayscale-[0.3]" : ""}
              variants={fadeUp}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase opacity-70">
                    Stage {s.order}
                  </p>
                  <h3 className="text-lg font-black">{s.title}</h3>
                  {s.meaningId ? (
                    <p className="mt-0.5 text-xs font-black opacity-90">
                      = {s.meaningId}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs font-medium leading-relaxed opacity-80 line-clamp-2">
                    {s.description}
                  </p>
                </div>
                <span className="neo-border neo-shadow-sm shrink-0 rounded-lg bg-neo-white px-2 py-1 text-xs font-black">
                  {s.isCompleted
                    ? "DONE"
                    : !s.unlocked
                      ? "LOCK"
                      : s.cooldownActive
                        ? "WAIT"
                        : `${s.attemptsLeft} LEFT`}
                </span>
              </div>
              {s.cooldownActive && (
                <div className="mt-3">
                  <CooldownTimer until={s.cooldownUntil} />
                </div>
              )}
            </NeoCard>
          );

          if (locked && !s.cooldownActive) {
            return <li key={s.id}>{content}</li>;
          }

          return (
            <li key={s.id}>
              <Link href={`/learn/${s.id}`} className="block">
                {content}
              </Link>
            </li>
          );
        })}
      </motion.ul>
    </section>
  );
}
