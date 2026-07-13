/**
 * Generate reference audio via Gemini TTS + upload to UploadThing + update Stage.referenceAudio.
 *
 * Usage: npm run seed:audio
 * Needs: GOOGLE_AI_API_KEY, UPLOADTHING_TOKEN, DATABASE_URL
 *
 * Free tier TTS ~3 RPM → script paces requests + retries 429.
 * Re-run safe: skips stages that already have ufs.sh / uploadthing URLs.
 */
import "dotenv/config";
import dns from "node:dns";
import { GoogleGenAI, Modality } from "@google/genai";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { UTApi, UTFile } from "uploadthing/server";
import { getGeminiKeyCount, withGeminiKey } from "../src/lib/ai/gemini-keys";
import { dbConnectionString } from "../src/lib/db/prisma";

dns.setDefaultResultOrder("ipv4first");

const pool = new Pool({
  connectionString: dbConnectionString(),
  connectionTimeoutMillis: 30_000,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const utapi = new UTApi();

const TTS_MODEL =
  process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
const VOICE = process.env.GEMINI_TTS_VOICE ?? "Kore";
const DELAY_MS = Number(process.env.TTS_DELAY_MS ?? 25_000);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRemoteAudio(url: string) {
  if (!url.startsWith("http")) return false;
  return (
    url.includes("ufs.sh") ||
    url.includes("uploadthing") ||
    url.includes("utfs.io")
  );
}

function parseRetryMs(err: unknown): number {
  const msg = err instanceof Error ? err.message : String(err);
  const m = msg.match(/retry in ([\d.]+)s/i);
  if (m) return Math.ceil(Number(m[1]) * 1000) + 2000;
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return 60_000;
  return 0;
}

async function ttsBuffer(
  text: string,
  language: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  const langHint = /french/i.test(language)
    ? "French"
    : /german/i.test(language)
      ? "German"
      : "English";
  const languageCode = /french/i.test(language)
    ? "fr-FR"
    : /german/i.test(language)
      ? "de-DE"
      : "en-US";
  const prompt = `Say clearly and naturally in ${langHint}, as a friendly language tutor demonstrating pronunciation for a beginner. Speak only this phrase, nothing else: ${text}`;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await withGeminiKey(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: TTS_MODEL,
          contents: prompt,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              languageCode,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: VOICE },
              },
            },
          },
        });

        const parts = response.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          const data = part.inlineData?.data;
          if (!data) continue;
          const mime = part.inlineData?.mimeType || "audio/wav";
          return { buffer: Buffer.from(data, "base64"), mime };
        }
        throw new Error("No audio parts in response");
      });
    } catch (e) {
      lastErr = e;
      const wait = parseRetryMs(e);
      const msg = e instanceof Error ? e.message : String(e);
      const retryable =
        wait > 0 ||
        msg.includes("INTERNAL") ||
        msg.includes("500") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("429");
      if (retryable && attempt < 5) {
        const backoff = wait > 0 ? wait : 5000 * attempt;
        console.log(
          `  retry in ${Math.ceil(backoff / 1000)}s (try ${attempt}/5)`
        );
        await sleep(backoff);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

function extFromMime(mime: string) {
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav") || mime.includes("L16") || mime.includes("pcm") || mime.includes("l16"))
    return "wav";
  return "wav";
}

function pcm16leToWav(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function toPlayableWav(
  buffer: Buffer,
  mime: string
): { buffer: Buffer; mime: string; ext: string } {
  const lower = mime.toLowerCase();
  if (lower.includes("l16") || lower.includes("pcm") || lower.includes("s16le")) {
    const rateMatch = lower.match(/rate=(\d+)/);
    const rate = rateMatch ? Number(rateMatch[1]) : 24000;
    return {
      buffer: pcm16leToWav(buffer, rate, 1),
      mime: "audio/wav",
      ext: "wav",
    };
  }
  return { buffer, mime: mime.startsWith("audio/") ? mime : "audio/wav", ext: extFromMime(mime) };
}

async function main() {
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error("UPLOADTHING_TOKEN is not set");
  }
  if (getGeminiKeyCount() === 0) {
    throw new Error(
      "No Gemini keys. Set GOOGLE_AI_API_KEY_1.. or GOOGLE_AI_API_KEY"
    );
  }
  console.log(`Gemini keys in pool: ${getGeminiKeyCount()}`);

  const stages = await prisma.stage.findMany({
    orderBy: [{ language: "asc" }, { order: "asc" }],
  });

  if (stages.length === 0) {
    console.error("No stages. Run npm run db:seed first.");
    process.exit(1);
  }

  console.log(`TTS model: ${TTS_MODEL}, voice: ${VOICE}, delay: ${DELAY_MS}ms`);
  console.log(`Stages: ${stages.length}`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const stage of stages) {
    if (isRemoteAudio(stage.referenceAudio)) {
      skip++;
      console.log(
        `[${stage.language} #${stage.order}] skip (already remote)`
      );
      continue;
    }

    const lang =
      stage.language === "FRENCH"
        ? "French"
        : stage.language === "GERMAN"
          ? "German"
          : "English";
    process.stdout.write(
      `[${stage.language} #${stage.order}] ${stage.expectedText} … `
    );

    try {
      const audio = await ttsBuffer(stage.expectedText, lang);
      if (!audio) {
        fail++;
        console.log("FAIL (no audio)");
        continue;
      }

      const playable = toPlayableWav(audio.buffer, audio.mime);
      const file = new UTFile(
        [new Uint8Array(playable.buffer)],
        `${stage.language.toLowerCase()}-${stage.order}.${playable.ext}`,
        { type: playable.mime }
      );

      const uploaded = await utapi.uploadFiles(file);
      if (uploaded.error || !uploaded.data) {
        fail++;
        console.log("FAIL upload", uploaded.error);
        continue;
      }

      const url = uploaded.data.ufsUrl ?? uploaded.data.url;
      if (!url) {
        fail++;
        console.log("FAIL no url");
        continue;
      }

      await prisma.stage.update({
        where: { id: stage.id },
        data: { referenceAudio: url },
      });

      ok++;
      console.log("OK", url);
    } catch (e) {
      fail++;
      console.log("ERR", e instanceof Error ? e.message : e);
    }

    await sleep(DELAY_MS);
  }

  console.log(`Done. ok=${ok} skip=${skip} fail=${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
