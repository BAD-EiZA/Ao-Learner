"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
};

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

const ACCOUNT_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/shop", label: "Shop" },
  { href: "/plus", label: "Plus" },
  { href: "/onboarding", label: "Goals" },
  { href: "/", label: "Home" },
] as const;

export function UserMenu({ name, email, picture }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = name || email || "User";
  const abbr = initials(name, email);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-neo-ink bg-neo-white py-0.5 pl-0.5 pr-2 font-black text-neo-ink shadow-[2px_2px_0_#1B4EF5] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border-2 border-neo-ink bg-neo-pink text-xs font-black">
          {picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picture}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            abbr
          )}
        </span>
        <span className="hidden max-w-[88px] truncate text-xs md:inline">
          {label}
        </span>
        <span
          className={`text-xs opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border-2 border-neo-ink bg-neo-white shadow-[4px_4px_0_#1B4EF5]"
          >
            <div className="border-b-2 border-neo-ink bg-neo-yellow/40 px-3 py-2">
              <p className="truncate text-xs font-black text-neo-ink">{label}</p>
              {email && name ? (
                <p className="truncate text-xs font-bold text-neo-muted">
                  {email}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col p-1">
              {ACCOUNT_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-left text-xs font-black uppercase text-neo-ink hover:bg-neo-yellow/15"
                >
                  {l.label}
                </Link>
              ))}
              <LogoutLink
                role="menuitem"
                className="mt-0.5 rounded-xl bg-neo-pink/80 px-3 py-2.5 text-left text-xs font-black uppercase text-neo-ink"
              >
                Log out
              </LogoutLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
