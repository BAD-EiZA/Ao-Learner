"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { languageLabel } from "@/lib/utils";
import type { CefrLevel, StageView } from "@/types/stage";
import { CEFR_LEVELS, CEFR_META } from "@/lib/cefr";
import { CooldownTimer } from "@/components/learn/CooldownTimer";
import { NeoBadge, NeoCard, fadeUp, stagger } from "@/components/ui/neo";

const tones = ["yellow", "cyan", "lime", "pink", "purple", "orange"] as const;

export function StageList({
  language,
  stages,
}: {
  language:
    | "ENGLISH"
    | "GERMAN"
    | "FRENCH"
    | "SPANISH"
    | "ITALIAN"
    | "PORTUGUESE";
  stages: StageView[];
}) {
  const byLevel = CEFR_LEVELS.map((level) => ({
    level,
    items: stages.filter((s) => (s.cefrLevel || "A1") === level),
  })).filter((g) => g.items.length > 0);

  const badgeTone =
    language === "ENGLISH"
      ? "cyan"
      : language === "GERMAN"
        ? "orange"
        : language === "FRENCH"
          ? "pink"
          : language === "SPANISH"
            ? "lime"
            : language === "ITALIAN"
              ? "purple"
              : "yellow";

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black uppercase tracking-tight text-neo-ink">
          {languageLabel(language)}
        </h2>
        <NeoBadge tone={badgeTone}>
          CEFR · {stages.length} stages
        </NeoBadge>
      </div>

      {byLevel.map(({ level, items }) => {
        const meta = CEFR_META[level as CefrLevel];
        return (
          <div key={level} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <NeoBadge tone={meta.tone}>{meta.label}</NeoBadge>
              <p className="text-xs font-medium text-neo-muted">{meta.blurb}</p>
            </div>
            <motion.ul
              className="grid gap-4 sm:grid-cols-2"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {items.map((s, i) => {
                const locked = !s.unlocked || s.cooldownActive;
                const tone = tones[i % tones.length]!;
                const content = (
                  <NeoCard
                    tone={
                      s.isCompleted ? "lime" : !s.unlocked ? "white" : tone
                    }
                    hover={s.unlocked && !s.cooldownActive}
                    className={!s.unlocked ? "opacity-70 grayscale-[0.3]" : ""}
                    variants={fadeUp}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-black uppercase opacity-70">
                          {s.cefrLevel || "A1"} · Stage {s.order}
                        </p>
                        <h3 className="text-lg font-black">{s.title}</h3>
                        {s.mode === "DIALOGUE" ? (
                          <p className="mt-0.5 text-xs font-black uppercase opacity-70">
                            Dialogue
                          </p>
                        ) : null}
                        {s.meaningId ? (
                          <p className="mt-0.5 text-xs font-black opacity-90">
                            = {s.meaningId}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs font-medium leading-relaxed opacity-80 line-clamp-2">
                          {s.description}
                        </p>
                      </div>
                      <span className="neo-border neo-shadow-sm shrink-0 rounded-lg bg-neo-white px-2 py-1 text-xs font-black text-neo-ink">
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
          </div>
        );
      })}
    </section>
  );
}
