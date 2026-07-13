import type { Language } from "@/generated/prisma/client";

export const LANGUAGES = ["ENGLISH", "GERMAN", "FRENCH"] as const;

export type AppLanguage = (typeof LANGUAGES)[number];

export const LANGUAGE_META: Record<
  AppLanguage,
  { code: string; short: string; label: string; speak: string; tts: string }
> = {
  ENGLISH: {
    code: "en",
    short: "EN",
    label: "English",
    speak: "English",
    tts: "en-US",
  },
  GERMAN: {
    code: "de",
    short: "DE",
    label: "German",
    speak: "German",
    tts: "de-DE",
  },
  FRENCH: {
    code: "fr",
    short: "FR",
    label: "French",
    speak: "French",
    tts: "fr-FR",
  },
};

export function parseLangParam(raw?: string | null): AppLanguage {
  const v = (raw ?? "").toLowerCase();
  if (v === "de" || v === "german" || v === "de-de") return "GERMAN";
  if (v === "fr" || v === "french" || v === "fr-fr") return "FRENCH";
  return "ENGLISH";
}

export function languageToSpeak(lang: Language | string): string {
  return LANGUAGE_META[lang as AppLanguage]?.speak ?? "English";
}

export function languageToTts(lang: string): string {
  if (/french|français|fr-fr|^fr$/i.test(lang)) return "fr-FR";
  if (/german|deutsch|de-de|^de$/i.test(lang)) return "de-DE";
  if (/indonesia|id-id|^id$/i.test(lang)) return "id-ID";
  return "en-US";
}

export function speakToLanguage(speak: string): AppLanguage {
  if (/french/i.test(speak) || speak === "fr") return "FRENCH";
  if (/german/i.test(speak) || speak === "de") return "GERMAN";
  return "ENGLISH";
}
