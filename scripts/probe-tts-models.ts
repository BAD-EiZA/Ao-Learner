/**
 * Probe which Gemini models can generate audio from text.
 * Usage: npx tsx scripts/probe-tts-models.ts
 */
import "dotenv/config";
import { GoogleGenAI, Modality } from "@google/genai";

const apiKey =
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

if (!apiKey) {
  console.error("No GOOGLE_AI_API_KEY");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-lite-preview",
  "gemini-2.5-flash-preview-tts",
  "gemini-2.5-flash-tts",
  "gemini-2.5-pro-preview-tts",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

async function listModels() {
  try {
    const pager = await ai.models.list();
    const names: string[] = [];
    for await (const m of pager) {
      if (m.name) names.push(m.name);
    }
    return names;
  } catch (e) {
    console.error("list models failed", e instanceof Error ? e.message : e);
    return [] as string[];
  }
}

async function tryTts(model: string) {
  try {
    const response = await ai.models.generateContent({
      model,
      contents:
        "Say clearly in English, only this phrase: Hello. Nothing else.",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          languageCode: "en-US",
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "unknown";
        const bytes = Buffer.from(part.inlineData.data, "base64").length;
        return { ok: true as const, mime, bytes };
      }
    }
    const text = response.text?.slice(0, 120);
    return { ok: false as const, reason: text || "no audio parts" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, reason: msg.slice(0, 280) };
  }
}

async function main() {
  console.log("=== list models (filter flash/lite/tts) ===");
  const all = await listModels();
  const interesting = all.filter((n) =>
    /flash|lite|tts|3\.1|audio/i.test(n)
  );
  for (const n of interesting) console.log(" ", n);
  if (!interesting.length) console.log(" (none / list empty)");

  console.log("\n=== TTS probe ===");
  const candidates = [
    ...new Set([
      ...MODELS,
      ...interesting
        .map((n) => n.replace(/^models\//, ""))
        .filter((n) => /tts|lite|flash/i.test(n)),
    ]),
  ];

  for (const model of candidates) {
    process.stdout.write(`${model} … `);
    const r = await tryTts(model);
    if (r.ok) console.log(`YES audio mime=${r.mime} bytes=${r.bytes}`);
    else console.log(`NO — ${r.reason}`);
    await new Promise((x) => setTimeout(x, 1500));
  }
}

main().catch(console.error);
