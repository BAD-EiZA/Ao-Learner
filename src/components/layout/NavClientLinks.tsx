"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppOptional } from "@/components/providers/AppProviders";
import { MobileNav } from "@/components/layout/MobileNav";
import { moreNavSections, navActive, primaryNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavClientLinks({ authed = false }: { authed?: boolean }) {
  const pathname = usePathname();
  const app = useAppOptional();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const primary = primaryNav();
  const moreSections = moreNavSections();
  const more = moreSections.flatMap((section) => section.items);

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  // Guest: no app routes in nav (all require login)
  if (!authed) return null;

  return (
    <>
      <MobileNav />

      {/* Desktop primary links — text, not rainbow pills */}
      <div className="hidden items-center gap-0.5 md:flex">
        {primary.map((item) => {
          const active = navActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-black uppercase tracking-wide transition-colors lg:px-3 lg:text-sm",
                active
                  ? "bg-neo-white !text-neo-ink shadow-[2px_2px_0_#1B4EF5]"
                  : "!text-white hover:bg-white/20"
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <div ref={moreRef} className="relative">
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="desktop-more-navigation"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-black uppercase tracking-wide lg:px-3 lg:text-sm",
              moreOpen || more.some((i) => navActive(pathname, i.href))
                ? "bg-neo-white !text-neo-ink shadow-[2px_2px_0_#1B4EF5]"
                : "!text-white hover:bg-white/20"
            )}
          >
            More
            <span
              className={cn(
                "text-xs opacity-80 transition-transform",
                moreOpen && "rotate-180"
              )}
            >
              ▼
            </span>
          </button>
          {moreOpen && (
            <div
              id="desktop-more-navigation"
              className="neo-border neo-shadow absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-neo-white p-3"
            >
              {moreSections.map((section) => (
                <div key={section.label} className="mb-2 last:mb-0">
                  <p className="px-2 py-1 text-xs font-black uppercase text-neo-muted">{section.label}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {section.items.map((item) => {
                      const active = navActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            "min-h-11 rounded-xl px-2.5 py-2 text-left text-xs font-black uppercase !text-neo-ink",
                            active ? "bg-neo-ink !text-neo-white" : "hover:bg-neo-yellow/15"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {app && (
        <div className="ml-1 hidden items-center gap-0.5 border-l-2 border-white/30 pl-2 lg:flex">
          <button
            type="button"
            aria-pressed={app.locale === "en"}
            className={cn(
              "min-h-11 rounded-md px-2 py-1 text-xs font-black",
              app.locale === "en"
                ? "bg-neo-white !text-neo-ink"
                : "!text-white/90 hover:bg-white/20"
            )}
            onClick={() => app.setLocale("en")}
          >
            EN
          </button>
          <button
            type="button"
            aria-pressed={app.locale === "id"}
            className={cn(
              "min-h-11 rounded-md px-2 py-1 text-xs font-black",
              app.locale === "id"
                ? "bg-neo-white !text-neo-ink"
                : "!text-white/90 hover:bg-white/20"
            )}
            onClick={() => app.setLocale("id")}
          >
            ID
          </button>
        </div>
      )}
    </>
  );
}
