import type { Language } from "@/generated/prisma/client";

/** Client-safe — no Prisma */

export function bucketsFromStage(params: {
  tags: string[];
  expectedText: string;
  language: Language;
  feedback?: string | null;
}) {
  const buckets = new Set<string>();
  for (const t of params.tags) buckets.add(t.toLowerCase());

  const text = params.expectedText.toLowerCase();
  const fb = (params.feedback ?? "").toLowerCase();

  if (params.language === "ENGLISH") {
    if (/th|think|thank|the |this|that/.test(text) || /th/.test(fb))
      buckets.add("en_th");
    if (/r[aeiou]|[aeiou]r/.test(text) || /\br\b|r sound/.test(fb))
      buckets.add("en_r");
    if (/l[aeiou]|[aeiou]l/.test(text)) buckets.add("en_l");
  } else {
    if (/ch|ich|ach|nicht|möchten/.test(text) || /ch/.test(fb))
      buckets.add("de_ch");
    if (/ü|ö|ä|heiße|können|für/.test(text) || /umlaut|ü|ö|ä/.test(fb))
      buckets.add("de_umlaut");
    if (/r[aeiouäöü]|[aeiouäöü]r/.test(text)) buckets.add("de_r");
  }

  if (buckets.size === 0) buckets.add("general");
  return [...buckets];
}

export const BUCKET_LABELS: Record<string, string> = {
  greeting: "Greetings",
  courtesy: "Courtesy",
  intro: "Introductions",
  everyday: "Everyday needs",
  repair: "Conversation repair",
  dialogue: "Dialogue",
  en_th: "English /th/",
  en_r: "English /r/",
  en_l: "English /l/",
  de_ch: "German /ch/",
  de_umlaut: "German umlauts",
  de_r: "German /r/",
  general: "General",
  a1: "A1",
  a2: "A2",
  b1: "B1",
  b2: "B2",
  c1: "C1",
};
