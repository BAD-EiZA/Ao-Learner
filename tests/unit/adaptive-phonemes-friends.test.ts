import { cefrRank } from "@/lib/learning/adaptive";
import { BUCKET_LABELS } from "@/lib/learning/phoneme-labels";
import { PLUS_COOLDOWN_HOURS } from "@/lib/constants";

describe("adaptive cefrRank", () => {
  test("order A1 A2 B1", () => {
    expect(cefrRank("A1")).toBe(0);
    expect(cefrRank("A2")).toBe(1);
    expect(cefrRank("B1")).toBe(2);
    expect(cefrRank("XX")).toBe(0);
  });
});

describe("phoneme labels", () => {
  test("has core buckets", () => {
    expect(BUCKET_LABELS.greeting).toBeTruthy();
    expect(BUCKET_LABELS.en_th).toContain("th");
    expect(BUCKET_LABELS.de_ch).toContain("ch");
  });
});

describe("plus cooldown shorter", () => {
  test("half hour default", () => {
    expect(PLUS_COOLDOWN_HOURS).toBe(0.5);
  });
});
