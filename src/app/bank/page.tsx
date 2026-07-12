import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { listWordBank } from "@/lib/learning/bank";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function BankPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/bank");
  const items = await listWordBank(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 py-8">
      <NeoBadge tone="lime">Word bank</NeoBadge>
      <h1 className="text-3xl font-black">Saved phrases</h1>
      <p className="text-sm font-medium text-neo-muted">
        Auto-saved when you score 75+ on a pass.
      </p>
      {items.length === 0 ? (
        <NeoCard hover={false}>
          <p className="font-bold">Empty — pass stages to fill the bank.</p>
        </NeoCard>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id}>
              <NeoCard className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-black">{it.phrase}</p>
                  <p className="text-xs font-bold opacity-70">
                    {it.meaningId} · {it.language}
                  </p>
                </div>
                {it.stageId && (
                  <Link href={`/learn/${it.stageId}?review=1`}>
                    <NeoButton tone="ink">Practice</NeoButton>
                  </Link>
                )}
              </NeoCard>
            </li>
          ))}
        </ul>
      )}
      <Link href="/dashboard">
        <NeoButton tone="white">← Dashboard</NeoButton>
      </Link>
    </div>
  );
}
