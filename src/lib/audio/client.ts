/** Browser helpers: raw PCM L16 (Gemini TTS / UploadThing) → playable WAV */

export function pcm16leToWavBlob(
  pcm: ArrayBuffer,
  sampleRate = 24000,
  channels = 1
): Blob {
  const pcmBytes = new Uint8Array(pcm);
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBytes.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcmBytes);

  return new Blob([buffer], { type: "audio/wav" });
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function parseRate(mime: string, fallback = 24000) {
  const m = mime.match(/rate=(\d+)/i);
  return m ? Number(m[1]) : fallback;
}

function isRawPcm(mime: string) {
  const m = mime.toLowerCase();
  return (
    m.includes("l16") ||
    m.includes("pcm") ||
    m.includes("linear16") ||
    m.includes("s16le")
  );
}

/**
 * Resolve any reference URL / data-URL into a playable object URL or data URL.
 * Caller should revokeObjectURL when done if starts with blob:.
 */
export async function resolvePlayableAudioUrl(src: string): Promise<{
  url: string;
  revoke?: () => void;
}> {
  // already embedded base64
  if (src.startsWith("data:")) {
    if (src.startsWith("data:audio/l16") || src.includes("pcm")) {
      // rare; skip complex parse
      return { url: src };
    }
    return { url: src };
  }

  const res = await fetch(src, { mode: "cors" });
  if (!res.ok) throw new Error(`Audio fetch failed (${res.status})`);

  const mime = (res.headers.get("content-type") || "").split(";")[0].trim() ||
    "application/octet-stream";
  const fullMime = res.headers.get("content-type") || mime;
  const buf = await res.arrayBuffer();

  if (isRawPcm(fullMime) || isRawPcm(mime)) {
    const rate = parseRate(fullMime, 24000);
    const blob = pcm16leToWavBlob(buf, rate, 1);
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  }

  // already container format
  if (
    mime.includes("wav") ||
    mime.includes("mpeg") ||
    mime.includes("mp3") ||
    mime.includes("ogg") ||
    mime.includes("webm") ||
    mime.includes("mp4") ||
    mime.includes("aac")
  ) {
    const blob = new Blob([buf], { type: mime });
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  }

  // unknown: try as WAV-wrapped PCM 24k (Gemini default)
  const blob = pcm16leToWavBlob(buf, 24000, 1);
  const url = URL.createObjectURL(blob);
  return { url, revoke: () => URL.revokeObjectURL(url) };
}
