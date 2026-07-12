import { test, expect } from "@playwright/test";

/**
 * Logged-in smoke via E2E_BYPASS_AUTH=1 on the Next server.
 * Skips if bypass not active (API still 401).
 */
test.describe("authenticated surfaces", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/hearts");
    if (res.status() === 401) {
      test.skip(
        true,
        "E2E_BYPASS_AUTH not enabled — run with default playwright webServer env"
      );
    }
  });

  test("GET /api/hearts returns hearts", async ({ request }) => {
    const res = await request.get("/api/hearts");
    expect(res.status()).toBe(200);
    const j = await res.json();
    expect(j.hearts).toBeGreaterThanOrEqual(0);
    expect(j.max).toBe(5);
  });

  test("GET /api/goals shop quests bank", async ({ request }) => {
    for (const path of [
      "/api/goals",
      "/api/shop",
      "/api/quests",
      "/api/bank",
      "/api/achievements",
      "/api/plus",
      "/api/trial",
      "/api/comeback",
      "/api/friends",
      "/api/club",
      "/api/checkpoint",
      "/api/streak-society",
    ]) {
      const res = await request.get(path);
      expect(res.status(), path).toBeLessThan(500);
      expect(res.status(), path).toBe(200);
    }
  });

  test("dashboard renders learn hub", async ({ page }) => {
    const res = await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(500);
    // Kinde proxy must be bypassed; body should be app shell not IdP
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/Powered by Kinde/i);
    expect(text).toMatch(/Dashboard|Path|Practice|Streak|XP|Ao|Learn/i);
  });

  test("path practice match shop talk gap", async ({ page }) => {
    for (const route of [
      "/path",
      "/practice",
      "/match",
      "/shop",
      "/talk",
      "/gap",
      "/report",
      "/stories",
      "/checkpoint",
      "/society",
      "/bank",
      "/friends",
      "/club",
      "/plus",
    ]) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status() ?? 0, route).toBeLessThan(500);
      // should not bounce to login host only
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("POST shop buy unknown fails soft", async ({ request }) => {
    const res = await request.post("/api/shop", {
      data: { itemId: "nope" },
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("POST goals set", async ({ request }) => {
    const res = await request.post("/api/goals", {
      data: { goal: 20 },
    });
    expect(res.status()).toBe(200);
    const j = await res.json();
    expect(j.goal).toBe(20);
  });
});
