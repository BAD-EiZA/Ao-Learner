/**
 * Pre-flight mic quality check before sending audio to AI.
 * Returns null if OK, or an error key message if rejected.
 */
export async function analyzeBlobQuality(blob: Blob): Promise<{
  ok: boolean;
  reason?: "quiet" | "noise" | "short" | "empty";
  rms: number;
  peak: number;
  durationSec: number;
}> {
  if (blob.size < 800) {
    return { ok: false, reason: "empty", rms: 0, peak: 0, durationSec: 0 };
  }

  const Ctx =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      : null;
  if (!Ctx) {
    return { ok: true, rms: 0.1, peak: 0.1, durationSec: 1 };
  }

  const ctx = new Ctx();
  try {
    const buf = await blob.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const channel = audio.getChannelData(0);
    const durationSec = audio.duration;

    if (durationSec < 0.35) {
      return { ok: false, reason: "short", rms: 0, peak: 0, durationSec };
    }

    let sum = 0;
    let peak = 0;
    // sample every N for speed
    const step = Math.max(1, Math.floor(channel.length / 8000));
    let n = 0;
    for (let i = 0; i < channel.length; i += step) {
      const v = Math.abs(channel[i]!);
      sum += v * v;
      if (v > peak) peak = v;
      n++;
    }
    const rms = Math.sqrt(sum / Math.max(1, n));

    // quiet gate
    if (rms < 0.012 && peak < 0.04) {
      return { ok: false, reason: "quiet", rms, peak, durationSec };
    }

    // crude noise: high floor with low speech variance
    let crossings = 0;
    for (let i = step; i < channel.length; i += step) {
      if (channel[i]! * channel[i - step]! < 0) crossings++;
    }
    const zcr = crossings / Math.max(1, n);
    if (rms > 0.08 && zcr > 0.35 && peak < 0.2) {
      return { ok: false, reason: "noise", rms, peak, durationSec };
    }

    return { ok: true, rms, peak, durationSec };
  } catch {
    // if decode fails, let server handle
    return { ok: true, rms: 0.05, peak: 0.1, durationSec: 1 };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}
