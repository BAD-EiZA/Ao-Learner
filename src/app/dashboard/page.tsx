import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getStagesWithProgress } from "@/lib/db/progress";
import { StageList } from "@/components/curriculum/StageList";
import type { StageView } from "@/types/stage";
import { NeoBadge, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/dashboard");

  let english: StageView[] = [];
  let german: StageView[] = [];
  let dbError: string | null = null;

  try {
    english = (await getStagesWithProgress(
      user.id,
      "ENGLISH"
    )) as StageView[];
    german = (await getStagesWithProgress(user.id, "GERMAN")) as StageView[];
  } catch (e) {
    dbError =
      e instanceof Error
        ? e.message
        : "Database unavailable. Set DATABASE_URL and run migrations.";
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-3 py-6 sm:px-6 sm:py-10">
      <div className="space-y-3">
        <NeoBadge tone="pink">Dashboard</NeoBadge>
        <h1 className="text-3xl font-black tracking-tight text-neo-ink sm:text-4xl">
          Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="max-w-xl text-sm font-medium text-neo-muted">
          Pick a language. Stages unlock in order. Pass with score ≥ 60.
        </p>
      </div>

      {dbError ? (
        <NeoCard tone="orange" hover={false}>
          <p className="font-black uppercase">Setup required</p>
          <p className="mt-1 text-sm font-medium opacity-90">{dbError}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs font-bold opacity-90">
            <li>Copy `.env.example` → `.env` and fill keys</li>
            <li>`npx prisma migrate dev --name init`</li>
            <li>`npm run db:seed`</li>
          </ol>
        </NeoCard>
      ) : (
        <>
          <StageList language="ENGLISH" stages={english} />
          <StageList language="GERMAN" stages={german} />
          {english.length === 0 && german.length === 0 && (
            <p className="text-sm font-bold text-neo-muted">
              No stages yet. Run `npm run db:seed`.
            </p>
          )}
        </>
      )}
    </div>
  );
}
