import type { CefrLevel } from "@/types/stage";

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1"];

export const CEFR_META: Record<
  CefrLevel,
  { label: string; blurb: string; tone: "cyan" | "lime" | "purple" }
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
    blurb: "Short dialogues and connected social exchanges.",
    tone: "purple",
  },
};

export function cefrLabel(level: CefrLevel | string | undefined) {
  if (!level) return "A1";
  return CEFR_META[level as CefrLevel]?.label ?? String(level);
}
