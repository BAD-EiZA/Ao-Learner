import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";
import { trackServer } from "@/lib/analytics-server";

export const dynamic = "force-dynamic";

const SCENARIOS = [
  {
    id: "cafe",
    title: "At the café",
    blurb: "Order a drink and handle a simple request.",
    tone: "cyan" as const,
  },
  {
    id: "berlin",
    title: "Lost in Berlin",
    blurb: "Ask for directions and say thanks.",
    tone: "orange" as const,
  },
];

export default async function ScenariosPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/scenarios");

  await trackServer("roleplay_start", { userId: user.id });

  const stages = await prisma.stage.findMany({
    where: { mode: "ROLEPLAY" },
    orderBy: [{ language: "asc" }, { order: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="pink">Role-play</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Scenarios</h1>
      <p className="text-sm font-medium text-neo-muted">
        Short multi-turn speaking scenes. Finish each line to complete the story.
      </p>

      {stages.length === 0 ? (
        <NeoCard tone="white" hover={false}>
          <p className="font-black">Scenarios loading…</p>
          <p className="text-sm font-medium opacity-80">
            Run <code className="font-black">npm run db:seed</code> to add café
            & Berlin role-plays.
          </p>
        </NeoCard>
      ) : (
        <ul className="space-y-4">
          {SCENARIOS.map((sc) => {
            const pack = stages.filter((s) => s.scenarioId === sc.id);
            if (!pack.length) return null;
            return (
              <li key={sc.id}>
                <NeoCard tone={sc.tone} hover={false} className="space-y-3">
                  <p className="text-xl font-black">{sc.title}</p>
                  <p className="text-sm font-medium opacity-90">{sc.blurb}</p>
                  <div className="flex flex-wrap gap-2">
                    {pack.map((s) => (
                      <Link key={s.id} href={`/learn/${s.id}`}>
                        <NeoButton tone="ink">
                          {s.language === "ENGLISH" ? "EN" : "DE"} · {s.title}
                        </NeoButton>
                      </Link>
                    ))}
                  </div>
                </NeoCard>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/dashboard">
        <NeoButton tone="white">← Dashboard</NeoButton>
      </Link>
    </div>
  );
}
