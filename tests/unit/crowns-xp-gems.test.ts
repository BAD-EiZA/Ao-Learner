import {
  crownEmoji,
  crownsFromScore,
  isLegendaryScore,
} from "@/lib/learning/crowns";
import {
  badgeForLevel,
  levelFromXp,
  xpForLevel,
  xpForScore,
  xpProgress,
} from "@/lib/learning/xp";
import { gemsForScore } from "@/lib/learning/gems";

describe("crowns", () => {
  test("crownsFromScore bands", () => {
    expect(crownsFromScore(null)).toBe(0);
    expect(crownsFromScore(undefined)).toBe(0);
    expect(crownsFromScore(50)).toBe(0);
    expect(crownsFromScore(60)).toBe(1);
    expect(crownsFromScore(75)).toBe(2);
    expect(crownsFromScore(85)).toBe(3);
    expect(crownsFromScore(92)).toBe(4);
    expect(crownsFromScore(98)).toBe(5);
    expect(crownsFromScore(100)).toBe(5);
  });

  test("legendary needs hard + 95", () => {
    expect(isLegendaryScore(95, true)).toBe(true);
    expect(isLegendaryScore(94, true)).toBe(false);
    expect(isLegendaryScore(100, false)).toBe(false);
  });

  test("crownEmoji", () => {
    expect(crownEmoji(0)).toBe("");
    expect(crownEmoji(3)).toBe("👑👑👑");
    expect(crownEmoji(9)).toBe("👑👑👑👑👑");
  });
});

describe("xp", () => {
  test("xpForLevel / levelFromXp inverse-ish", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelFromXp(0)).toBe(1);
    const xp = xpForLevel(5);
    expect(levelFromXp(xp)).toBe(5);
    expect(levelFromXp(xp - 1)).toBe(4);
  });

  test("xpForScore", () => {
    expect(xpForScore(40, false)).toBe(5);
    expect(xpForScore(20, false)).toBe(5);
    expect(xpForScore(90, false)).toBe(9);
    expect(xpForScore(96, true)).toBe(40);
    expect(xpForScore(85, true)).toBe(30);
    expect(xpForScore(75, true)).toBe(22);
    expect(xpForScore(65, true)).toBe(15);
  });

  test("xpProgress", () => {
    const p = xpProgress(0);
    expect(p.level).toBe(1);
    expect(p.pct).toBeGreaterThanOrEqual(0);
    expect(p.need).toBeGreaterThan(0);
  });

  test("badgeForLevel", () => {
    expect(badgeForLevel(1).name).toBe("Novice");
    expect(badgeForLevel(12).name).toBe("Master");
    expect(badgeForLevel(5).emoji).toBeTruthy();
  });
});

describe("gems", () => {
  test("gemsForScore", () => {
    expect(gemsForScore(90, false)).toBe(0);
    expect(gemsForScore(96, true)).toBe(5);
    expect(gemsForScore(80, true)).toBe(3);
    expect(gemsForScore(70, true)).toBe(1);
  });
});
