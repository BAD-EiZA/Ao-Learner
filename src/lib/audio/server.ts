/** Convert raw PCM s16le mono to WAV container (browser-playable). */
export function pcm16leToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1
): string {
  const pcm = Buffer.from(pcmBase64, "base64");
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
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
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]).toString("base64");
}

export function parseAudioMime(mime: string): {
  isPcm: boolean;
  sampleRate: number;
  channels: number;
  playableMime: string;
} {
  const lower = mime.toLowerCase();
  const rateMatch = lower.match(/rate=(\d+)/);
  const chMatch = lower.match(/channels=(\d+)/);
  const sampleRate = rateMatch ? Number(rateMatch[1]) : 24000;
  const channels = chMatch ? Number(chMatch[1]) : 1;
  const isPcm =
    lower.includes("l16") ||
    lower.includes("pcm") ||
    lower.includes("linear16");

  return {
    isPcm,
    sampleRate,
    channels,
    playableMime: isPcm ? "audio/wav" : mime.split(";")[0] || "audio/wav",
  };
}
