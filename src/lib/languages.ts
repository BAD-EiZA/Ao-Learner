import type { Language } from "@/generated/prisma/client";

export const LANGUAGES = [
  "ENGLISH",
  "GERMAN",
  "FRENCH",
  "SPANISH",
  "ITALIAN",
  "PORTUGUESE",
] as const;

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
  SPANISH: {
    code: "es",
    short: "ES",
    label: "Spanish",
    speak: "Spanish",
    tts: "es-ES",
  },
  ITALIAN: {
    code: "it",
    short: "IT",
    label: "Italian",
    speak: "Italian",
    tts: "it-IT",
  },
  PORTUGUESE: {
    code: "pt",
    short: "PT",
    label: "Portuguese",
    speak: "Portuguese",
    tts: "pt-BR",
  },
};

export function parseLangParam(raw?: string | null): AppLanguage {
  const v = (raw ?? "").toLowerCase();
  if (v === "de" || v === "german" || v === "de-de") return "GERMAN";
  if (v === "fr" || v === "french" || v === "fr-fr") return "FRENCH";
  if (v === "es" || v === "spanish" || v === "es-es" || v === "español")
    return "SPANISH";
  if (v === "it" || v === "italian" || v === "it-it" || v === "italiano")
    return "ITALIAN";
  if (
    v === "pt" ||
    v === "portuguese" ||
    v === "pt-br" ||
    v === "pt-pt" ||
    v === "português" ||
    v === "portugues"
  )
    return "PORTUGUESE";
  return "ENGLISH";
}

export function languageToSpeak(lang: Language | string): string {
  return LANGUAGE_META[lang as AppLanguage]?.speak ?? "English";
}

export function languageToTts(lang: string): string {
  if (/portuguese|português|portugues|pt-br|pt-pt|^pt$/i.test(lang))
    return "pt-BR";
  if (/italian|italiano|it-it|^it$/i.test(lang)) return "it-IT";
  if (/spanish|español|es-es|^es$/i.test(lang)) return "es-ES";
  if (/french|français|fr-fr|^fr$/i.test(lang)) return "fr-FR";
  if (/german|deutsch|de-de|^de$/i.test(lang)) return "de-DE";
  if (/indonesia|id-id|^id$/i.test(lang)) return "id-ID";
  return "en-US";
}

export function speakToLanguage(speak: string): AppLanguage {
  if (/portuguese|português|portugues/i.test(speak) || speak === "pt")
    return "PORTUGUESE";
  if (/italian|italiano/i.test(speak) || speak === "it") return "ITALIAN";
  if (/spanish|español/i.test(speak) || speak === "es") return "SPANISH";
  if (/french/i.test(speak) || speak === "fr") return "FRENCH";
  if (/german/i.test(speak) || speak === "de") return "GERMAN";
  return "ENGLISH";
}

export function languageShort(lang: Language | string): string {
  return LANGUAGE_META[lang as AppLanguage]?.short ?? String(lang).slice(0, 2);
}
