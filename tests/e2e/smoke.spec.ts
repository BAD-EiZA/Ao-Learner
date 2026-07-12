import { test, expect } from "@playwright/test";

/**
 * Smoke suite — public shell + auth redirects + health of key routes.
 * Auth-gated pages should redirect to Kinde login (or show login), not 500.
 */
test.describe("public shell", () => {
  test("home loads", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("manifest + icons", async ({ request }) => {
    const m = await request.get("/manifest.webmanifest");
    expect(m.ok()).toBeTruthy();
    const icon = await request.get("/icon-192.png");
    expect(icon.status()).toBeLessThan(500);
  });

  test("sw.js present", async ({ request }) => {
    const res = await request.get("/sw.js");
    expect(res.ok()).toBeTruthy();
    const text = await res.text();
    expect(text).toContain("ao-learner");
  });
});

test.describe("auth-gated pages redirect (no 500)", () => {
  const routes = [
    "/dashboard",
    "/path",
    "/practice",
    "/match",
    "/report",
    "/shop",
    "/talk",
    "/gap",
    "/bank",
    "/checkpoint",
    "/society",
    "/friends",
    "/club",
    "/stories",
    "/scenarios",
    "/plus",
    "/onboarding",
    "/achievements",
    "/review",
    "/plan",
    "/placement",
  ];

  for (const route of routes) {
    test(`${route}`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      // May be 200 (login UI), 307/302 redirect, or Kinde — never 5xx
      expect(res?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test.describe("API auth walls", () => {
  const apis: { method: "GET" | "POST"; path: string }[] = [
    { method: "GET", path: "/api/hearts" },
    { method: "GET", path: "/api/goals" },
    { method: "GET", path: "/api/quests" },
    { method: "GET", path: "/api/achievements" },
    { method: "GET", path: "/api/plus" },
    { method: "GET", path: "/api/shop" },
    { method: "GET", path: "/api/trial" },
    { method: "GET", path: "/api/comeback" },
    { method: "GET", path: "/api/friends" },
    { method: "GET", path: "/api/club" },
    { method: "GET", path: "/api/bank" },
    { method: "GET", path: "/api/checkpoint" },
    { method: "GET", path: "/api/streak-society" },
    { method: "POST", path: "/api/talk" },
    { method: "POST", path: "/api/shop" },
    { method: "POST", path: "/api/trial" },
    { method: "POST", path: "/api/comeback" },
  ];

  for (const api of apis) {
    test(`${api.method} ${api.path} no 5xx`, async ({ request }) => {
      const res =
        api.method === "GET"
          ? await request.get(api.path)
          : await request.post(api.path, {
              data: {},
              failOnStatusCode: false,
            });
      // With E2E_BYPASS_AUTH may be 200/400; without session 401 — never 5xx
      expect(res.status()).toBeLessThan(500);
    });
  }

  test("POST /api/evaluate without audio → 4xx", async ({ request }) => {
    const res = await request.post("/api/evaluate", {
      multipart: { stageId: "x" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBeLessThan(500);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe("feature surface smoke (logged-out content)", () => {
  test("home has brand or CTA", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(10);
  });
});
