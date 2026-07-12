export const PASS_SCORE = Number(process.env.PASS_SCORE_THRESHOLD ?? 60);
export const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS ?? 3);
export const COOLDOWN_HOURS = Number(process.env.COOLDOWN_HOURS ?? 3);
/** Plus members get shorter lockout after max fails */
export const PLUS_COOLDOWN_HOURS = Number(
  process.env.PLUS_COOLDOWN_HOURS ?? 0.5
);
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
export const VRM_URL = "/model.vrm";

/** TTS models tried in order for evaluate feedback voice */
export const GEMINI_TTS_MODELS = (
  process.env.GEMINI_TTS_MODELS ??
  "gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE ?? "Kore";

export const EMOTIONS = [
  "neutral",
  "joy",
  "sorrow",
  "angry",
  "fun",
] as const;

export type Emotion = (typeof EMOTIONS)[number];
