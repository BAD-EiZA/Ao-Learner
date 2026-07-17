"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppOptional } from "@/components/providers/AppProviders";
import { NAV_SECTIONS, navActive } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const app = useAppOptional();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-neo-ink bg-neo-white text-lg font-black text-neo-ink shadow-[2px_2px_0_#1B4EF5] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
            ref={dialogRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 max-h-[min(85dvh,calc(100dvh-4rem))] overflow-y-auto border-b-4 border-neo-ink bg-neo-white px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_12px_40px_rgba(27,78,245,0.15)] sm:inset-x-3 sm:top-[4.5rem] sm:rounded-2xl sm:border-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-neo-muted">Navigasi</p>
              <button
                type="button"
                className="min-h-11 rounded-lg px-3 py-2 text-xs font-black text-neo-muted"
                onClick={() => setOpen(false)}
              >
                Tutup
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="space-y-3">
              {NAV_SECTIONS.map((section) => (
                <section key={section.label} aria-labelledby={`nav-${section.label}`}>
                  <h2 id={`nav-${section.label}`} className="mb-1 px-3 text-xs font-black uppercase text-neo-muted">
                    {section.label}
                  </h2>
                  <div className="grid grid-cols-2 gap-1">
                    {section.items.map((item) => {
                      const active = navActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex min-h-11 items-center rounded-xl px-3 text-sm font-black",
                            active
                              ? "bg-neo-ink text-neo-white"
                              : "text-neo-ink hover:bg-neo-yellow/10"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>
            {app && (
              <button
                type="button"
                aria-pressed={app.reducedMotion}
                className={cn(
                  "mt-4 min-h-11 w-full rounded-xl border-2 border-neo-ink px-3 text-xs font-black",
                  app.reducedMotion ? "bg-neo-ink text-neo-white" : "bg-neo-white"
                )}
                onClick={() => app.setReducedMotion(!app.reducedMotion)}
              >
                {app.reducedMotion ? "Reduced motion on" : "Reduced motion off"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
