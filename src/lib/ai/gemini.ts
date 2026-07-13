import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { GoogleGenAI, Modality } from "@google/genai";
import {
  GEMINI_MODEL,
  GEMINI_TTS_MODELS,
  GEMINI_TTS_VOICE,
  PASS_SCORE,
  type Emotion,
} from "@/lib/constants";
import { parseAudioMime, pcm16leToWavBase64 } from "@/lib/audio/server";
import { isKnownBone, VRM_GESTURE_BONES } from "@/lib/vrm/bones";
import { withGeminiKey } from "@/lib/ai/gemini-keys";

export type ScoreBreakdown = {
  sounds: number;
  completeness: number;
  stress: number;
  clarity: number;
};

export type WordHeatItem = {
  word: string;
  score: number;
};

export type EvaluateResult = {
  score: number;
  is_correct: boolean;
  feedback_text: string;
  emotion: Emotion;
  bone_commands: { boneName: string; rotation: [number, number, number] }[];
  audio_content: string | null;
  audio_mime: string | null;
  breakdown: ScoreBreakdown | null;
  word_heat: WordHeatItem[];
};

const responseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.NUMBER },
    feedback_text: { type: SchemaType.STRING },
    emotion: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["neutral", "joy", "sorrow", "angry", "fun", "surprised"],
    },
    breakdown: {
      type: SchemaType.OBJECT,
      properties: {
        sounds: { type: SchemaType.NUMBER },
        completeness: { type: SchemaType.NUMBER },
        stress: { type: SchemaType.NUMBER },
        clarity: { type: SchemaType.NUMBER },
      },
      required: ["sounds", "completeness", "stress", "clarity"],
    },
    bone_commands: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          boneName: { type: SchemaType.STRING },
          rotation: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
          },
        },
        required: ["boneName", "rotation"],
      },
    },
    word_scores: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
        },
        required: ["word", "score"],
      },
    },
  },
  required: [
    "score",
    "feedback_text",
    "emotion",
    "bone_commands",
    "breakdown",
    "word_scores",
  ],
};

export async function evaluateSpeech(params: {
  audioBase64: string;
  mimeType: string;
  expectedText: string;
  language: string;
  /** Feedback language for learner (not target language) */
  feedbackLocale?: "en" | "id";
  hardMode?: boolean;
}): Promise<EvaluateResult> {
  const fbLang =
    params.feedbackLocale === "id" ? "Indonesian" : "English";
  const hardNote = params.hardMode
    ? "HARD MODE: be stricter. Deduct more for weak endings/stress. Prefer scores 5–10 lower than normal when borderline."
    : "";

  const prompt = `You are a STRICT pronunciation examiner for ${params.language} learners.
Expected target phrase (exact): "${params.expectedText}"
${hardNote}

Listen carefully to the user's spoken audio. Your job is pronunciation accuracy first.

SCORING RULES (be strict, do not inflate scores):
1) Transcribe what you hear (internal). Compare to expected phrase.
2) Weight the score as:
   - 50% phoneme / sound accuracy (vowels, consonants, endings)
   - 25% word completeness (missing/extra/wrong words)
   - 15% stress & rhythm (natural language stress)
   - 10% clarity / intelligibility
2b) Also return breakdown object with sounds, completeness, stress, clarity each 0-100.
2c) Return word_scores: array of { word, score 0-100 } for EACH word in the expected phrase (same order/spelling as expected, without punctuation). Score each word independently.
3) Score bands:
   - 90-100: near-native match, all key sounds correct
   - 75-89: clearly recognizable, minor sound issues only
   - 60-74: acceptable pass — meaning clear, some mispronunciation
   - 40-59: partial — several wrong sounds or missing syllables
   - 20-39: hard to match expected phrase
   - 0-19: silence, wrong language, unrelated speech, or unintelligible
4) If audio is silent, mostly noise, or not attempting the phrase → score ≤ 15.
5) If wrong language or completely different words → score ≤ 25.
6) Do NOT give ≥ 60 unless the expected words are mostly present AND recognizable.
7) Pass threshold is ${PASS_SCORE}. Only mark high scores when pronunciation truly deserves it.

feedback_text rules:
- Max 2 short sentences in ${fbLang}, spoken-friendly (will be read aloud).
- Point to 1 concrete sound/word to fix when failing.
- Praise specifically when passing (which sound was good).

emotion: joy if score≥${PASS_SCORE}, sorrow if 30-59, angry if <30, fun if playful tip, neutral only if borderline.

bone_commands: 1-3 poses { boneName, rotation: [x,y,z] radians }.
boneName MUST be exactly one of: ${VRM_GESTURE_BONES.join(", ")}
Keep |rotation| < 0.8.

Return JSON only with: score, feedback_text, emotion, bone_commands, breakdown, word_scores.`;

  const text = await withGeminiKey(async (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: params.mimeType || "audio/webm",
          data: params.audioBase64,
        },
      },
    ]);

    return result.response.text();
  });

  let parsed: {
    score?: number;
    feedback_text?: string;
    emotion?: Emotion;
    bone_commands?: { boneName: string; rotation: number[] }[];
    breakdown?: ScoreBreakdown;
    word_scores?: { word?: string; score?: number }[];
  };

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      score: 0,
      feedback_text: "Could not parse evaluation. Please try again.",
      emotion: "sorrow",
      bone_commands: [{ boneName: "head", rotation: [0, -0.15, 0] }],
      breakdown: { sounds: 0, completeness: 0, stress: 0, clarity: 0 },
      word_scores: [],
    };
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));
  const is_correct = score >= PASS_SCORE;
  const emotion = (parsed.emotion ??
    (is_correct ? "joy" : "sorrow")) as Emotion;
  const bone_commands = (parsed.bone_commands ?? [])
    .filter((b) => b.boneName && isKnownBone(b.boneName))
    .map((b) => ({
      boneName: b.boneName,
      rotation: [
        Number(b.rotation?.[0] ?? 0),
        Number(b.rotation?.[1] ?? 0),
        Number(b.rotation?.[2] ?? 0),
      ] as [number, number, number],
    }));

  const feedback_text =
    parsed.feedback_text ||
    (is_correct
      ? "Great job! Your pronunciation is clear."
      : "Keep practicing — focus on clarity and stress.");

  const bd = parsed.breakdown;
  const breakdown: ScoreBreakdown = {
    sounds: Math.max(0, Math.min(100, Math.round(Number(bd?.sounds) || score))),
    completeness: Math.max(
      0,
      Math.min(100, Math.round(Number(bd?.completeness) || score))
    ),
    stress: Math.max(0, Math.min(100, Math.round(Number(bd?.stress) || score))),
    clarity: Math.max(
      0,
      Math.min(100, Math.round(Number(bd?.clarity) || score))
    ),
  };

  const { alignWordHeat } = await import("@/lib/learning/word-heat");
  const word_heat = alignWordHeat(
    params.expectedText,
    parsed.word_scores,
    score
  );

  // TTS language follows feedback locale for ID learners; target lang otherwise
  const ttsLang =
    params.feedbackLocale === "id"
      ? "Indonesian"
      : params.language;
  const spoken = await generateSpeechBase64(feedback_text, ttsLang);

  return {
    score,
    is_correct,
    feedback_text,
    emotion,
    bone_commands,
    audio_content: spoken?.base64 ?? null,
    audio_mime: spoken?.mime ?? null,
    breakdown,
    word_heat,
  };
}

/**
 * TTS with model mix + multi-key random.
 * Default models: gemini-3.1-flash-tts-preview → gemini-2.5-flash-preview-tts
 */
export async function generateSpeechBase64(
  text: string,
  language: string
): Promise<{ base64: string; mime: string; model: string } | null> {
  const langCode = /french|français/i.test(language)
    ? "fr-FR"
    : /german|deutsch/i.test(language)
      ? "de-DE"
      : /indonesia/i.test(language)
        ? "id-ID"
        : "en-US";
  const prompt = `Speak as a friendly language tutor. Say only the following feedback clearly, nothing else: ${text}`;

  for (const model of GEMINI_TTS_MODELS) {
    try {
      const result = await withGeminiKey(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              languageCode: langCode,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE },
              },
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          const data = part.inlineData?.data;
          if (!data) continue;
          const rawMime = part.inlineData?.mimeType || "audio/wav";
          const meta = parseAudioMime(rawMime);

          if (meta.isPcm) {
            return {
              base64: pcm16leToWavBase64(data, meta.sampleRate, meta.channels),
              mime: "audio/wav",
              model,
            };
          }

          return {
            base64: data,
            mime: meta.playableMime,
            model,
          };
        }
        throw new Error(`No audio parts from ${model}`);
      });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[tts] ${model} failed:`, msg.slice(0, 200));
    }
  }

  return null;
}
