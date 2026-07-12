import {
  alignWordHeat,
  avgWordHeat,
  clampScore,
  heatClass,
  heatTone,
  tokenizePhrase,
} from "@/lib/learning/word-heat";

describe("word-heat", () => {
  test("tokenizePhrase strips punctuation", () => {
    expect(tokenizePhrase("Hello, world!")).toEqual(["Hello", "world"]);
    expect(tokenizePhrase("  How are you?  ")).toEqual(["How", "are", "you"]);
    expect(tokenizePhrase("")).toEqual([]);
  });

  test("clampScore", () => {
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(150)).toBe(100);
    expect(clampScore(72.6)).toBe(73);
    expect(clampScore(NaN)).toBe(0);
  });

  test("alignWordHeat by word match", () => {
    const heat = alignWordHeat("Good morning", [
      { word: "morning", score: 40 },
      { word: "Good", score: 90 },
    ]);
    expect(heat).toEqual([
      { word: "Good", score: 90 },
      { word: "morning", score: 40 },
    ]);
  });

  test("alignWordHeat positional + fallback", () => {
    const heat = alignWordHeat("A B C", [{ word: "x", score: 10 }], 55);
    expect(heat[0]!.score).toBe(10);
    expect(heat[1]!.score).toBe(55);
    expect(heat[2]!.score).toBe(55);
  });

  test("alignWordHeat empty expected", () => {
    expect(alignWordHeat("   ", [])).toEqual([]);
  });

  test("heatTone and heatClass", () => {
    expect(heatTone(90)).toBe("ok");
    expect(heatTone(75)).toBe("warm");
    expect(heatTone(55)).toBe("cold");
    expect(heatTone(20)).toBe("hot");
    expect(heatClass(90)).toContain("lime");
    expect(heatClass(20)).toContain("pink");
  });

  test("avgWordHeat", () => {
    expect(avgWordHeat([])).toBe(0);
    expect(avgWordHeat([
      { word: "a", score: 80 },
      { word: "b", score: 60 },
    ])).toBe(70);
  });
});
