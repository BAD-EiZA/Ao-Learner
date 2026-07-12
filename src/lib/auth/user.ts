import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/db/prisma";

/** Dev/e2e only — never enable in production */
async function e2eBypassUser() {
  if (process.env.E2E_BYPASS_AUTH !== "1") return null;
  if (process.env.NODE_ENV === "production") return null;

  const kindeId = process.env.E2E_KINDE_ID ?? "e2e-test-user";
  const email = process.env.E2E_USER_EMAIL ?? "e2e@ao-learner.test";
  const name = process.env.E2E_USER_NAME ?? "E2E Tester";

  const user = await prisma.user.upsert({
    where: { kindeId },
    update: { email, name },
    create: { kindeId, email, name },
  });

  await prisma.userStats.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      placementDone: true,
      placementCefr: "A1",
      hearts: 5,
      gems: 100,
    },
    update: {},
  });

  return user;
}

export async function requireUser() {
  const bypass = await e2eBypassUser();
  if (bypass) return bypass;

  const { isAuthenticated, getUser } = getKindeServerSession();
  if (!(await isAuthenticated())) return null;

  const kindeUser = await getUser();
  if (!kindeUser?.id || !kindeUser.email) return null;

  const user = await prisma.user.upsert({
    where: { kindeId: kindeUser.id },
    update: {
      email: kindeUser.email,
      name:
        [kindeUser.given_name, kindeUser.family_name]
          .filter(Boolean)
          .join(" ") || kindeUser.email,
    },
    create: {
      kindeId: kindeUser.id,
      email: kindeUser.email,
      name:
        [kindeUser.given_name, kindeUser.family_name]
          .filter(Boolean)
          .join(" ") || kindeUser.email,
    },
  });

  return user;
}
