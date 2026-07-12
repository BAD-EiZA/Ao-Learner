import "dotenv/config";
import { generateSpeechBase64 } from "../src/lib/ai/gemini";
import { GEMINI_TTS_MODELS } from "../src/lib/constants";

async function main() {
  console.log("chain:", GEMINI_TTS_MODELS.join(" → "));
  const r = await generateSpeechBase64(
    "Great job! Your pronunciation is clear.",
    "English"
  );
  if (!r) {
    console.error("FAIL: no audio from any TTS model");
    process.exit(1);
  }
  console.log("OK model=", r.model, "mime=", r.mime, "bytes=", Buffer.from(r.base64, "base64").length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
