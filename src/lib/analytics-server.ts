import type { AnalyticsName } from "@/lib/analytics";

export async function trackServer(
  name: AnalyticsName | string,
  opts?: { userId?: string | null; props?: Record<string, unknown> }
) {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.analyticsEvent.create({
      data: {
        name,
        userId: opts?.userId ?? null,
        props: (opts?.props as object | undefined) ?? undefined,
      },
    });
  } catch (e) {
    console.warn("[analytics]", name, e);
  }
}
