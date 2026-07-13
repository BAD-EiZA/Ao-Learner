import type { CefrLevel } from "@/types/stage";

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export const CEFR_META: Record<
  CefrLevel,
  {
    label: string;
    blurb: string;
    tone: "cyan" | "lime" | "purple" | "orange" | "pink";
  }
> = {
  A1: {
    label: "A1 · Beginner",
    blurb: "Simple greetings, introductions, and everyday courtesy.",
    tone: "cyan",
  },
  A2: {
    label: "A2 · Elementary",
    blurb: "Shopping, directions, ordering, and basic help.",
    tone: "lime",
  },
  B1: {
    label: "B1 · Intermediate",
    blurb: "Opinions, plans, and connected social exchanges.",
    tone: "purple",
  },
  B2: {
    label: "B2 · Upper intermediate",
    blurb: "Arguments, explanations, and fluent everyday discussion.",
    tone: "orange",
  },
  C1: {
    label: "C1 · Advanced",
    blurb: "Nuanced opinions, abstract topics, and precise expression.",
    tone: "pink",
  },
};

export function cefrLabel(level: CefrLevel | string | undefined) {
  if (!level) return "A1";
  return CEFR_META[level as CefrLevel]?.label ?? String(level);
}
