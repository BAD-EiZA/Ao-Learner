import { prisma } from "@/lib/db/prisma";
import {
  getAdaptivePassThreshold,
  getRecommendedList,
  getWeakSpots,
  recommendNextStage,
  updateDifficultyBoost,
} from "@/lib/learning/adaptive";
import {
  bucketsFromStage,
  getSkillHeatmap,
  recordPhonemeStats,
} from "@/lib/learning/phonemes";
import { getWeeklyReport } from "@/lib/learning/report";
import { PASS_SCORE } from "@/lib/constants";

const p = prisma as unknown as {
  userStats: { findUnique: jest.Mock; update: jest.Mock };
  attemptHistory: { findMany: jest.Mock };
  userProgress: { findMany: jest.Mock; count: jest.Mock };
  stage: { findMany: jest.Mock; findUnique: jest.Mock };
  phonemeStat: { findMany: jest.Mock; upsert: jest.Mock };
  userAchievement: { findMany: jest.Mock };
};

describe("adaptive threshold branches", () => {
  test("A1 base, A2 bump, B1 bump, hard, cap", async () => {
    p.userStats.findUnique.mockResolvedValue({ passBoost: 0 });
    expect(await getAdaptivePassThreshold("u", "A1")).toBe(PASS_SCORE);
    expect(await getAdaptivePassThreshold("u", "A2")).toBe(PASS_SCORE + 4);
    expect(await getAdaptivePassThreshold("u", "B1")).toBe(PASS_SCORE + 8);
    expect(await getAdaptivePassThreshold("u", "A1", true)).toBe(
      PASS_SCORE + 10
    );
    p.userStats.findUnique.mockResolvedValue({ passBoost: 50 });
    expect(await getAdaptivePassThreshold("u", "B1", true)).toBe(90);
    p.userStats.findUnique.mockResolvedValue(null);
    expect(await getAdaptivePassThreshold("u")).toBe(PASS_SCORE);
  });
});

describe("updateDifficultyBoost branches", () => {
  test("no stats", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    await updateDifficultyBoost("u", 90, true);
    expect(p.userStats.update).not.toHaveBeenCalled();
  });

  test("raise after 3 strong passes", async () => {
    p.userStats.findUnique.mockResolvedValue({
      consecutivePasses: 2,
      passBoost: 0,
    });
    p.userStats.update.mockResolvedValue({});
    await updateDifficultyBoost("u", 90, true);
    expect(p.userStats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passBoost: 2, consecutivePasses: 0 }),
      })
    );
  });

  test("fail lowers boost", async () => {
    p.userStats.findUnique.mockResolvedValue({
      consecutivePasses: 5,
      passBoost: 4,
    });
    p.userStats.update.mockResolvedValue({});
    await updateDifficultyBoost("u", 40, false);
    expect(p.userStats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consecutivePasses: 0,
          passBoost: 3,
        }),
      })
    );
  });

  test("pass below 85 no boost change path", async () => {
    p.userStats.findUnique.mockResolvedValue({
      consecutivePasses: 1,
      passBoost: 0,
    });
    p.userStats.update.mockResolvedValue({});
    await updateDifficultyBoost("u", 70, true);
    expect(p.userStats.update).toHaveBeenCalled();
  });
});

describe("getWeakSpots aggregation", () => {
  test("aggregates fails and filters", async () => {
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "s1",
        score: 40,
        passed: false,
        stage: {
          id: "s1",
          title: "T1",
          expectedText: "Hi",
          meaningId: "m",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
      {
        stageId: "s1",
        score: 50,
        passed: false,
        stage: {
          id: "s1",
          title: "T1",
          expectedText: "Hi",
          meaningId: "m",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
      {
        stageId: "s2",
        score: 90,
        passed: true,
        stage: {
          id: "s2",
          title: "T2",
          expectedText: "Bye",
          meaningId: "m2",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "s1", bestScore: 50 },
      { stageId: "s2", bestScore: 90 },
    ]);
    const weak = await getWeakSpots("u", 6);
    expect(weak.some((w) => w.stageId === "s1")).toBe(true);
    expect(weak.find((w) => w.stageId === "s1")?.failCount).toBe(2);
  });
});

describe("recommendNextStage paths", () => {
  test("remedial when failCount >= 2", async () => {
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "w1",
        score: 30,
        passed: false,
        stage: {
          id: "w1",
          title: "Weak",
          expectedText: "X",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
      {
        stageId: "w1",
        score: 20,
        passed: false,
        stage: {
          id: "w1",
          title: "Weak",
          expectedText: "X",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "w1", bestScore: 30 },
    ]);
    const r = await recommendNextStage("u", "ENGLISH");
    expect(r?.type).toBe("remedial");
    expect(r?.stageId).toBe("w1");
  });

  test("next unlocked stage with hot prev", async () => {
    p.attemptHistory.findMany.mockResolvedValue([]);
    p.userProgress.findMany.mockResolvedValue([]);
    p.stage.findMany.mockResolvedValue([
      {
        id: "a",
        title: "A",
        expectedText: "Hello",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [{ isCompleted: true, bestScore: 95 }],
      },
      {
        id: "b",
        title: "B",
        expectedText: "Hi",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [],
      },
    ]);
    const r = await recommendNextStage("u", "ENGLISH");
    expect(r?.type).toBe("next");
    expect(r?.stageId).toBe("b");
    expect(r?.reason).toMatch(/hot/i);
  });

  test("null when all done no weak", async () => {
    p.attemptHistory.findMany.mockResolvedValue([]);
    p.userProgress.findMany.mockResolvedValue([]);
    p.stage.findMany.mockResolvedValue([
      {
        id: "a",
        title: "A",
        expectedText: "Hello",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [{ isCompleted: true, bestScore: 80 }],
      },
    ]);
    expect(await recommendNextStage("u", "ENGLISH")).toBeNull();
  });

  test("review fallback single fail weak", async () => {
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "w1",
        score: 40,
        passed: false,
        stage: {
          id: "w1",
          title: "OneFail",
          expectedText: "X",
          meaningId: "",
          language: "GERMAN",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "w1", bestScore: 40 },
    ]);
    p.stage.findMany.mockResolvedValue([]);
    const r = await recommendNextStage("u", "GERMAN");
    expect(r?.type).toBe("review");
  });
});

describe("getRecommendedList", () => {
  test("merges next + weak without dupes", async () => {
    p.attemptHistory.findMany.mockResolvedValue([]);
    p.userProgress.findMany.mockResolvedValue([]);
    p.stage.findMany.mockResolvedValue([
      {
        id: "n1",
        title: "Next",
        expectedText: "Go",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [],
      },
    ]);
    p.stage.findUnique.mockResolvedValue({
      id: "n1",
      title: "Next",
      expectedText: "Go",
      language: "ENGLISH",
      cefrLevel: "A1",
    });
    // weak empty via attempts []
    const list = await getRecommendedList("u", 5);
    expect(list[0]?.stageId).toBe("n1");
    expect(list[0]?.kind).toBe("next");
  });
});

describe("phonemes bucketsFromStage", () => {
  test("english th r l", () => {
    const b = bucketsFromStage({
      tags: ["greeting"],
      expectedText: "Thank you really well",
      language: "ENGLISH",
      feedback: "watch the th",
    });
    expect(b).toEqual(expect.arrayContaining(["greeting", "en_th"]));
  });

  test("german ch umlaut r", () => {
    const b = bucketsFromStage({
      tags: [],
      expectedText: "Ich möchte für dich",
      language: "GERMAN",
    });
    expect(b.some((x) => x === "de_ch" || x === "de_umlaut")).toBe(true);
  });

  test("general fallback", () => {
    const b = bucketsFromStage({
      tags: [],
      expectedText: "xyz",
      language: "ENGLISH",
    });
    expect(b).toContain("general");
  });
});

describe("recordPhonemeStats + heatmap", () => {
  test("upserts each bucket", async () => {
    p.phonemeStat.upsert.mockResolvedValue({});
    await recordPhonemeStats({
      userId: "u",
      language: "ENGLISH",
      tags: ["a1"],
      expectedText: "Thank you",
      score: 70,
      passed: false,
      feedback: "th",
    });
    expect(p.phonemeStat.upsert).toHaveBeenCalled();
  });

  test("heatmap maps averages", async () => {
    p.phonemeStat.findMany.mockResolvedValue([
      {
        bucket: "en_th",
        language: "ENGLISH",
        attempts: 2,
        fails: 1,
        sumScore: 140,
      },
      {
        bucket: "empty",
        language: "ENGLISH",
        attempts: 0,
        fails: 0,
        sumScore: 0,
      },
    ]);
    const h = await getSkillHeatmap("u");
    expect(h[0]!.avgScore).toBe(70);
    expect(h[0]!.failRate).toBe(50);
    expect(h[1]!.avgScore).toBe(0);
  });
});

describe("weekly report", () => {
  test("empty week", async () => {
    p.attemptHistory.findMany.mockResolvedValue([]);
    p.userStats.findUnique.mockResolvedValue(null);
    p.phonemeStat.findMany.mockResolvedValue([]);
    p.userAchievement.findMany.mockResolvedValue([]);
    const r = await getWeeklyReport("u");
    expect(r.totalAttempts).toBe(0);
    expect(r.avgScore).toBe(0);
    expect(r.failRate).toBe(0);
    expect(r.level).toBe(1);
    expect(r.leagueTier).toBe("bronze");
  });

  test("with attempts heat badges", async () => {
    const now = new Date();
    p.attemptHistory.findMany.mockResolvedValue([
      { score: 80, passed: true, createdAt: now },
      { score: 40, passed: false, createdAt: now },
    ]);
    p.userStats.findUnique.mockResolvedValue({
      xp: 200,
      weekXp: 30,
      level: 3,
      currentStreak: 4,
      leagueTier: "silver",
    });
    p.phonemeStat.findMany.mockResolvedValue([
      {
        bucket: "en_th",
        language: "ENGLISH",
        attempts: 4,
        fails: 2,
        sumScore: 200,
      },
    ]);
    p.userAchievement.findMany.mockResolvedValue([
      { code: "first_perfect", unlockedAt: now },
    ]);
    const r = await getWeeklyReport("u");
    expect(r.totalAttempts).toBe(2);
    expect(r.passed).toBe(1);
    expect(r.avgScore).toBe(60);
    expect(r.failRate).toBe(50);
    expect(r.weekXp).toBe(30);
    expect(r.weakSpots.length).toBeGreaterThanOrEqual(1);
    expect(r.badgesUnlocked.some((b) => b.code === "first_perfect")).toBe(
      true
    );
    expect(r.activeDays).toBe(1);
  });
});
