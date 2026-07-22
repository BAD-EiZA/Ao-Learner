"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarViewer } from "@/components/vrm/AvatarViewer";
import { NeoBadge, NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";
import { VRM_ANIMS } from "@/lib/vrm/anims";

type Turn = { role: "user" | "tutor"; text: string };

const IDLE = VRM_ANIMS.Idle;
const THINKING = VRM_ANIMS.Thinking;
const GREETING = VRM_ANIMS.Greeting;
const LIMIT = 5;

async function readTalkJson(res: Response): Promise<Record<string, unknown>> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return (await res.json()) as Record<string, unknown>;
  }
  // Kinde middleware often redirects unauthenticated API → HTML login
  if (res.redirected || res.status === 307 || res.status === 302) {
    throw new Error("Session expired — log in again.");
  }
  if (res.status === 401) {
    throw new Error("Please log in to talk with Ao.");
  }
  const text = await res.text().catch(() => "");
  if (text.trimStart().startsWith("<!")) {
    throw new Error("Session expired — log in again.");
  }
  throw new Error(
    text.slice(0, 160) || `Request failed (${res.status})`
  );
}

export default function TalkPage() {
  const [lang, setLang] = useState<
    "English" | "German" | "French" | "Spanish" | "Italian" | "Portuguese"
  >("English");
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [anim, setAnim] = useState(GREETING);
  const [loopAnim, setLoopAnim] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const returnToIdle = useCallback(() => {
    setAnim(IDLE);
    setLoopAnim(true);
  }, []);

  useEffect(() => {
    void fetch("/api/talk", { credentials: "same-origin" })
      .then(async (r) => {
        const d = await readTalkJson(r);
        if (typeof d.remaining === "number") setRemaining(d.remaining);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history, busy]);

  const limitedOut = remaining !== null && remaining <= 0;

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy || limitedOut) return;
    setBusy(true);
    setInput("");
    setAnim(THINKING);
    setLoopAnim(true);
    setHistory((h) => [...h, { role: "user", text: msg }]);
    try {
      const res = await fetch("/api/talk", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          language: lang,
          history,
          level: "A1",
        }),
      });
      const data = await readTalkJson(res);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (!res.ok) {
        const err =
          typeof data.error === "string" ? data.error : `Error ${res.status}`;
        setHistory((h) => [...h, { role: "tutor", text: err }]);
        setAnim(VRM_ANIMS.Sad);
        setLoopAnim(false);
        return;
      }
      const reply =
        typeof data.reply === "string" && data.reply
          ? data.reply
          : "…";
      setHistory((h) => [...h, { role: "tutor", text: reply }]);
      setAnim(VRM_ANIMS.Blush);
      setLoopAnim(false);
    } catch (e) {
      const err =
        e instanceof Error ? e.message : "Network error. Try again.";
      setHistory((h) => [...h, { role: "tutor", text: err }]);
      setAnim(VRM_ANIMS.Sad);
      setLoopAnim(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-2 py-3 sm:px-4 sm:py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only" id="talk-language-label">Conversation language</span>
          <NeoBadge tone="danger">Talk with Ao</NeoBadge>
          <NeoBadge tone={limitedOut ? "warning" : "surface"}>
            {remaining == null
              ? `…/${LIMIT}`
              : `${remaining}/${LIMIT} left today`}
          </NeoBadge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["English", "EN"],
              ["German", "DE"],
              ["French", "FR"],
              ["Spanish", "ES"],
              ["Italian", "IT"],
              ["Portuguese", "PT"],
            ] as const
          ).map(([value, short]) => (
            <NeoButton
              key={value}
              tone={lang === value ? "primary" : "surface"}
              aria-pressed={lang === value}
              aria-describedby="talk-language-label"
              onClick={() => {
                setLang(value);
                setHistory([]);
              }}
            >
              {short}
            </NeoButton>
          ))}
          <NeoLink href="/dashboard" tone="surface">← Dashboard</NeoLink>
        </div>
      </div>

      <div className="neo-border neo-shadow grid overflow-hidden rounded-2xl bg-neo-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative h-[min(48dvh,420px)] w-full border-b-2 border-neo-ink lg:h-[min(78dvh,720px)] lg:min-h-[520px] lg:border-b-0 lg:border-r-2">
          <AvatarViewer
            emotion={anim.emotion}
            animationUrl={anim.url}
            autoRotate={false}
            loopAnimation={loopAnim}
            fadeDuration={0.65}
            onAnimationFinished={returnToIdle}
            backgroundColor="#F4CEFF"
            modelY={0.12}
            cameraPosition={[0, 1.42, 1.35]}
            cameraTarget={[0, 1.28, 0]}
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="flex min-h-[360px] flex-col lg:min-h-0">
          <NeoCard
            tone="white"
            hover={false}
            className="flex min-h-0 flex-1 flex-col rounded-none border-0 shadow-none"
          >
            <div
              ref={listRef}
              role="log"
              aria-live="polite"
              aria-busy={busy}
              aria-label="Conversation with Ao"
              className="min-h-0 flex-1 space-y-2 overflow-y-auto px-1 py-1 sm:px-2"
            >
              {history.length === 0 && (
                <p className="text-sm font-bold text-neo-muted">
                  Say hello — Ao replies in {lang}. Max {LIMIT} messages / day.
                </p>
              )}
              {limitedOut && (
                <p role="alert" className="rounded-xl bg-neo-orange/30 px-3 py-2 text-sm font-bold">
                  Daily limit reached. Come back tomorrow.
                </p>
              )}
              {history.map((t, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${
                    t.role === "user"
                      ? "ml-6 bg-neo-cyan/30 sm:ml-10"
                      : "mr-6 bg-neo-pink/40 sm:mr-10"
                  }`}
                >
                  <span className="text-xs uppercase opacity-60">
                    {t.role === "user" ? "You" : "Ao"}
                  </span>
                  <p>{t.text}</p>
                </div>
              ))}
              {busy && (
                <p className="text-xs font-black uppercase text-neo-muted">
                  Ao is thinking…
                </p>
              )}
            </div>
            <form
              className="mt-2 flex flex-col gap-2 border-t-2 border-neo-ink/10 pt-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              aria-busy={busy}
            >
              <label htmlFor="talk-message" className="sr-only">Message to Ao</label>
              <input
                id="talk-message"
                className="neo-border min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-bold"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  limitedOut
                    ? "Daily limit reached"
                    : "Type what you would say…"
                }
                disabled={busy || limitedOut}
              />
              <NeoButton
                tone="primary"
                type="submit"
                className="w-full sm:w-auto"
                disabled={busy || limitedOut}
              >
                {busy ? "…" : "Send"}
              </NeoButton>
            </form>
          </NeoCard>
        </div>
      </div>
    </div>
  );
}
