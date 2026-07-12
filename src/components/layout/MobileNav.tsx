"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppOptional } from "@/components/providers/AppProviders";

const LINKS = [
  { href: "/dashboard", label: "Learn", tone: "bg-neo-cyan" },
  { href: "/path", label: "Path", tone: "bg-neo-lime" },
  { href: "/practice", label: "Practice", tone: "bg-neo-yellow" },
  { href: "/review", label: "Review", tone: "bg-neo-orange" },
  { href: "/plan", label: "Plan", tone: "bg-neo-pink" },
  { href: "/match", label: "Match", tone: "bg-neo-cyan" },
  { href: "/talk", label: "Talk", tone: "bg-neo-pink" },
  { href: "/shop", label: "Shop", tone: "bg-neo-yellow" },
  { href: "/stories", label: "Stories", tone: "bg-neo-purple" },
  { href: "/scenarios", label: "Role-play", tone: "bg-neo-white" },
  { href: "/report", label: "Report", tone: "bg-neo-yellow" },
  { href: "/gap", label: "Speak gap", tone: "bg-neo-orange" },
  { href: "/bank", label: "Word bank", tone: "bg-neo-lime" },
  { href: "/checkpoint", label: "Checkpoint", tone: "bg-neo-ink text-neo-white" },
  { href: "/society", label: "Streak", tone: "bg-neo-orange" },
  { href: "/friends", label: "Friends", tone: "bg-neo-cyan" },
  { href: "/club", label: "Club", tone: "bg-neo-purple" },
  { href: "/achievements", label: "Badges", tone: "bg-neo-purple" },
  { href: "/plus", label: "Plus", tone: "bg-neo-white" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const app = useAppOptional();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="neo-border neo-shadow-sm neo-press flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-neo-white px-3 font-black"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-neo-ink/30"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="neo-border neo-shadow-lg fixed inset-x-3 top-[4.5rem] z-50 max-h-[min(80vh,calc(100dvh-5.5rem))] overflow-y-auto rounded-2xl bg-neo-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          >
            <p className="mb-2 text-[10px] font-black uppercase text-neo-muted">
              Menu
            </p>
            <nav className="grid grid-cols-2 gap-2">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`neo-border neo-shadow-sm neo-press flex min-h-11 items-center justify-center rounded-xl px-2 py-2 text-center text-xs font-black uppercase ${l.tone} ${
                    pathname === l.href || pathname.startsWith(l.href + "/")
                      ? "ring-2 ring-neo-ink"
                      : ""
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            {app && (
              <div className="mt-3 flex flex-wrap gap-2 border-t-3 border-neo-ink pt-3">
                <button
                  type="button"
                  className={`neo-border min-h-11 min-w-11 rounded-xl px-3 text-xs font-black ${
                    app.locale === "en"
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white"
                  }`}
                  onClick={() => app.setLocale("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={`neo-border min-h-11 min-w-11 rounded-xl px-3 text-xs font-black ${
                    app.locale === "id"
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white"
                  }`}
                  onClick={() => app.setLocale("id")}
                >
                  ID
                </button>
                <button
                  type="button"
                  className={`neo-border min-h-11 flex-1 rounded-xl px-3 text-xs font-black ${
                    app.reducedMotion
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white"
                  }`}
                  onClick={() => app.setReducedMotion(!app.reducedMotion)}
                >
                  {app.reducedMotion ? "Motion: Off" : "Motion: On"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
