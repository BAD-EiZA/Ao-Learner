/**
 * Probe all Gemini API keys from env.
 * Usage: npx tsx scripts/probe-keys.ts
 */
import "dotenv/config";
import {
  listGeminiKeys,
  probeAllGeminiKeys,
  getGeminiKeyCount,
} from "../src/lib/ai/gemini-keys";

async function main() {
  const n = getGeminiKeyCount();
  console.log(`Found ${n} key(s) in env:\n`);
  for (const k of listGeminiKeys()) {
    console.log(`  - ${k.label}  ${k.mask}`);
  }

  if (n === 0) {
    console.error(
      "\nNo keys. Set GOOGLE_AI_API_KEY_1..N or GOOGLE_AI_API_KEYS=k1,k2"
    );
    process.exit(1);
  }

  console.log("\nProbing (tiny generateContent)…\n");
  const results = await probeAllGeminiKeys();

  let ok = 0;
  let bad = 0;
  for (const r of results) {
    if (r.ok) {
      ok++;
      console.log(`  OK   ${r.label}  ${r.mask}`);
    } else {
      bad++;
      console.log(`  FAIL ${r.label}  ${r.mask}`);
      console.log(`       ${r.error?.replace(/\n/g, " ").slice(0, 160)}`);
    }
  }

  console.log(`\nSummary: ok=${ok} fail=${bad} total=${results.length}`);
  if (bad > 0) process.exitCode = 1;
  if (ok === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
