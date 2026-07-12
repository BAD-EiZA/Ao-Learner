import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getUserAchievements } from "@/lib/learning/achievements";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await requireUser();
  if (!user)
    redirect("/api/auth/login?post_login_redirect_url=/achievements");

  const items = await getUserAchievements(user.id);
  const unlocked = items.filter((i) => i.unlocked).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="purple">Achievements</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Badges</h1>
      <p className="text-sm font-medium text-neo-muted">
        {unlocked}/{items.length} unlocked
      </p>
      <Link href="/dashboard">
        <NeoButton tone="white">← Dashboard</NeoButton>
      </Link>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <li key={a.code}>
            <NeoCard
              tone={a.unlocked ? "lime" : "white"}
              hover={false}
              className={a.unlocked ? "" : "opacity-60"}
            >
              <p className="text-2xl">{a.emoji}</p>
              <p className="font-black">{a.title}</p>
              <p className="text-sm font-medium">{a.description}</p>
              <p className="mt-1 text-xs font-bold opacity-70">+{a.xp} XP</p>
              {a.unlocked && a.unlockedAt && (
                <p className="text-[10px] font-bold opacity-60">
                  {new Date(a.unlockedAt).toLocaleDateString()}
                </p>
              )}
            </NeoCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
