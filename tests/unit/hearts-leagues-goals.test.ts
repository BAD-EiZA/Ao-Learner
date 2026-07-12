import {
  HEART_REGEN_MIN,
  MAX_HEARTS,
  regenHearts,
} from "@/lib/learning/hearts";
import { LEAGUE_TIERS, weekKey } from "@/lib/learning/leagues";
import { XP_GOALS } from "@/lib/learning/goals";
import { PLUS_PERKS } from "@/lib/learning/plus";
import { SHOP_ITEMS } from "@/lib/learning/shop";
import { DAILY_QUESTS } from "@/lib/learning/quests";
import { ACHIEVEMENTS } from "@/lib/learning/achievements";
import { unitKeyForOrder } from "@/lib/learning/checkpoint";
import {
  COMEBACK,
  isComebackLapse,
} from "@/lib/learning/comeback";
import {
  milestoneForStreak,
  nextMilestone,
  STREAK_MILESTONES,
} from "@/lib/learning/streak-society";
import {
  COOLDOWN_HOURS,
  EMOTIONS,
  MAX_ATTEMPTS,
  PASS_SCORE,
  PLUS_COOLDOWN_HOURS,
} from "@/lib/constants";
import { t, messages } from "@/lib/i18n/messages";
import { isOnCooldown } from "@/lib/db/progress";

describe("hearts regen", () => {
  test("plus always full", () => {
    const r = regenHearts(1, new Date(0), true);
    expect(r.hearts).toBe(MAX_HEARTS);
  });

  test("full hearts no change", () => {
    const at = new Date();
    const r = regenHearts(MAX_HEARTS, at, false);
    expect(r.hearts).toBe(MAX_HEARTS);
    expect(r.heartsUpdatedAt).toBe(at);
  });

  test("regen after elapsed", () => {
    const at = new Date(Date.now() - HEART_REGEN_MIN * 60 * 1000 * 2 - 1000);
    const r = regenHearts(1, at, false);
    expect(r.hearts).toBe(3);
  });

  test("no regen yet", () => {
    const at = new Date();
    expect(regenHearts(2, at, false).hearts).toBe(2);
  });
});

describe("leagues weekKey", () => {
  test("format YYYY-Www", () => {
    const k = weekKey(new Date("2026-07-12T12:00:00Z"));
    expect(k).toMatch(/^\d{4}-W\d{2}$/);
  });

  test("tiers ordered", () => {
    expect(LEAGUE_TIERS[0]).toBe("bronze");
    expect(LEAGUE_TIERS).toContain("ruby");
  });
});

describe("catalog constants", () => {
  test("goals shop quests achievements", () => {
    expect(XP_GOALS).toEqual([10, 20, 30]);
    expect(SHOP_ITEMS.length).toBe(3);
    expect(SHOP_ITEMS.every((i) => i.cost > 0)).toBe(true);
    expect(DAILY_QUESTS.length).toBe(3);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(8);
    expect(PLUS_PERKS.length).toBeGreaterThan(0);
  });

  test("app constants", () => {
    expect(PASS_SCORE).toBeGreaterThanOrEqual(50);
    expect(MAX_ATTEMPTS).toBe(3);
    expect(COOLDOWN_HOURS).toBeGreaterThan(0);
    expect(PLUS_COOLDOWN_HOURS).toBeLessThan(COOLDOWN_HOURS);
    expect(EMOTIONS).toContain("joy");
  });
});

describe("checkpoint unitKey", () => {
  test("groups of 5", () => {
    expect(unitKeyForOrder(1)).toBe("u1");
    expect(unitKeyForOrder(5)).toBe("u1");
    expect(unitKeyForOrder(6)).toBe("u2");
    expect(unitKeyForOrder(18)).toBe("u4");
  });
});

describe("comeback pure", () => {
  test("isComebackLapse", () => {
    const now = new Date("2026-07-12T00:00:00Z");
    expect(isComebackLapse(null, now)).toBe(false);
    expect(
      isComebackLapse(new Date("2026-07-11T00:00:00Z"), now)
    ).toBe(false);
    expect(
      isComebackLapse(new Date("2026-07-09T00:00:00Z"), now)
    ).toBe(true);
    expect(COMEBACK.LAPSE_DAYS).toBe(3);
    expect(COMEBACK.BONUS_XP).toBe(40);
  });
});

describe("streak society", () => {
  test("milestones", () => {
    expect(milestoneForStreak(0)).toBeNull();
    expect(milestoneForStreak(7)?.title).toBe("Week Warrior");
    expect(milestoneForStreak(100)?.days).toBe(100);
    expect(nextMilestone(0)?.days).toBe(3);
    expect(nextMilestone(100)).toBeNull();
    expect(STREAK_MILESTONES.length).toBe(5);
  });
});

describe("i18n", () => {
  test("en and id keys parity", () => {
    const enKeys = Object.keys(messages.en);
    const idKeys = Object.keys(messages.id);
    expect(enKeys.sort()).toEqual(idKeys.sort());
    expect(t("en", "nav_learn")).toBe("Learn");
    expect(t("id", "nav_learn")).toBe("Belajar");
  });
});

describe("cooldown helper", () => {
  test("isOnCooldown", () => {
    expect(isOnCooldown(null)).toBe(false);
    expect(isOnCooldown(undefined)).toBe(false);
    expect(isOnCooldown(new Date(Date.now() + 60_000))).toBe(true);
    expect(isOnCooldown(new Date(Date.now() - 60_000))).toBe(false);
  });
});
