"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppOptional } from "@/components/providers/AppProviders";
import { NAV_ITEMS, navActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

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
        className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-ink bg-neo-white text-lg font-black text-neo-ink shadow-[2px_2px_0_#1B4EF5] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-neo-ink/25 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 max-h-[min(85dvh,calc(100dvh-4rem))] overflow-y-auto border-b-4 border-neo-ink bg-neo-white px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_12px_40px_rgba(27,78,245,0.15)] sm:inset-x-3 sm:top-[4.5rem] sm:rounded-2xl sm:border-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-wider text-neo-muted">
                Navigate
              </p>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-black text-neo-muted"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((l) => {
                const active = navActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center rounded-xl px-3 text-sm font-black",
                      active
                        ? "bg-neo-ink text-neo-white"
                        : "text-neo-ink hover:bg-neo-yellow/10"
                    )}
                  >
                    {l.label}
                    {l.primary ? (
                      <span className="ml-auto text-[9px] font-bold uppercase opacity-50">
                        main
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            {app && (
              <div className="mt-3 flex gap-2 border-t-2 border-neo-ink/15 pt-3">
                <button
                  type="button"
                  className={cn(
                    "min-h-10 flex-1 rounded-xl border-2 border-neo-ink text-xs font-black",
                    app.locale === "en"
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white"
                  )}
                  onClick={() => app.setLocale("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={cn(
                    "min-h-10 flex-1 rounded-xl border-2 border-neo-ink text-xs font-black",
                    app.locale === "id"
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white"
                  )}
                  onClick={() => app.setLocale("id")}
                >
                  ID
                </button>
                <button
                  type="button"
                  className={cn(
                    "min-h-10 flex-[1.4] rounded-xl border-2 border-neo-ink text-xs font-black",
                    app.reducedMotion
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white"
                  )}
                  onClick={() => app.setReducedMotion(!app.reducedMotion)}
                >
                  {app.reducedMotion ? "Motion off" : "Motion on"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
