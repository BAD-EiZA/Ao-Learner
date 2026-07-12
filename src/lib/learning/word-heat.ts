export type WordHeat = {
  word: string;
  score: number; // 0–100
};

/** Split expected phrase into display words (keeps punctuation stripped for match) */
export function tokenizePhrase(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean);
}

/** Clamp score */
export function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

/**
 * Align model word_scores to expected phrase tokens.
 * Missing words → 0; extra ignored; length mismatch fills with overall score.
 */
export function alignWordHeat(
  expectedText: string,
  wordScores: { word?: string; score?: number }[] | null | undefined,
  fallbackScore = 50
): WordHeat[] {
  const tokens = tokenizePhrase(expectedText);
  if (!tokens.length) return [];

  const raw = Array.isArray(wordScores) ? wordScores : [];
  const byLower = new Map<string, number>();
  for (const w of raw) {
    const key = String(w.word ?? "")
      .toLowerCase()
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!key) continue;
    byLower.set(key, clampScore(Number(w.score)));
  }

  return tokens.map((word, i) => {
    const key = word.toLowerCase();
    if (byLower.has(key)) {
      return { word, score: byLower.get(key)! };
    }
    // positional fallback
    if (raw[i] && typeof raw[i]!.score === "number") {
      return { word, score: clampScore(raw[i]!.score!) };
    }
    return { word, score: clampScore(fallbackScore) };
  });
}

/** Tailwind-ish heat class from score */
export function heatTone(score: number): "hot" | "warm" | "ok" | "cold" {
  if (score >= 85) return "ok";
  if (score >= 70) return "warm";
  if (score >= 50) return "cold";
  return "hot";
}

export function heatClass(score: number): string {
  const t = heatTone(score);
  if (t === "ok") return "bg-neo-lime text-neo-ink";
  if (t === "warm") return "bg-neo-yellow text-neo-ink";
  if (t === "cold") return "bg-neo-orange text-neo-white";
  return "bg-neo-pink text-neo-ink";
}

/** Average of word heats */
export function avgWordHeat(words: WordHeat[]) {
  if (!words.length) return 0;
  return clampScore(words.reduce((s, w) => s + w.score, 0) / words.length);
}
