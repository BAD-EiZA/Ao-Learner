import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";
import { GapClient } from "@/components/learn/GapClient";
import { NeoBadge, NeoButton } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

function makeGap(text: string) {
  const words = text.replace(/[?.!,]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { display: "_____", full: text, blank: text };
  }
  if (words.length === 1) {
    const w = words[0]!;
    // Keep first letter as hint for single-word phrases
    const blank = w;
    const display =
      w.length <= 2 ? "_____" : `${w[0]}${"_".repeat(Math.min(5, w.length - 1))}`;
    return { display, full: text, blank };
  }
  const idx = Math.floor(words.length / 2);
  const blank = words[idx]!;
  const display = words
    .map((w, i) => (i === idx ? "_____" : w))
    .join(" ");
  return { display, full: text, blank };
}

export default async function GapPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/gap");
  const sp = await searchParams;
  const { parseLangParam, LANGUAGE_META, LANGUAGES } = await import(
    "@/lib/languages"
  );
  const language = parseLangParam(sp.lang);
  const stages = await prisma.stage.findMany({
    where: { language, mode: "PHRASE" },
    orderBy: { order: "asc" },
    take: 12,
  });
  const items = stages.map((s) => {
    const g = makeGap(s.expectedText);
    return {
      stageId: s.id,
      full: g.full,
      display: g.display,
      blank: g.blank,
      meaningId: s.meaningId,
      referenceAudio: s.referenceAudio,
    };
  });

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8">
      <NeoBadge tone="orange">Speak the gap</NeoBadge>
      <h1 className="text-3xl font-black">Fill the blank</h1>
      <p className="text-sm font-medium text-neo-muted">
        See the sentence with a missing word — say the full phrase.
      </p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <Link key={l} href={`/gap?lang=${LANGUAGE_META[l].code}`}>
            <NeoButton tone={language === l ? "ink" : "white"}>
              {LANGUAGE_META[l].short}
            </NeoButton>
          </Link>
        ))}
      </div>
      <GapClient items={items} />
    </div>
  );
}
