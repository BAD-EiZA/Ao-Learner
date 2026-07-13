import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getMatchDeck } from "@/lib/learning/match";
import { MatchGameClient } from "@/components/learn/MatchGameClient";
import { NeoBadge, NeoButton } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/match");

  const sp = await searchParams;
  const { parseLangParam, LANGUAGE_META, LANGUAGES } = await import(
    "@/lib/languages"
  );
  const lang = parseLangParam(sp.lang);
  const deck = await getMatchDeck(lang, 6);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="cyan">Match pairs</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Match the meaning</h1>
      <p className="text-sm font-medium text-neo-muted">
        No mic needed — warm up before speaking.
      </p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <Link key={l} href={`/match?lang=${LANGUAGE_META[l].code}`}>
            <NeoButton tone={lang === l ? "ink" : "white"}>
              {LANGUAGE_META[l].short}
            </NeoButton>
          </Link>
        ))}
        <Link href="/practice">
          <NeoButton tone="orange">Practice hub</NeoButton>
        </Link>
      </div>
      {deck.length < 2 ? (
        <p className="font-bold">Need more stages. Run seed.</p>
      ) : (
        <MatchGameClient items={deck} />
      )}
    </div>
  );
}
