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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="neo-border neo-shadow-sm neo-press flex min-h-11 items-center gap-2 rounded-xl bg-neo-white py-1 pl-1 pr-2 font-black text-neo-ink"
      >
        <span className="neo-border flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-neo-pink text-xs font-black">
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
        <span className="hidden max-w-[100px] truncate text-xs sm:inline">
          {label}
        </span>
        <span
          className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}
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
            className="neo-border neo-shadow absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-neo-white"
          >
            <div className="border-b-3 border-neo-ink bg-neo-yellow px-3 py-2">
              <p className="truncate text-xs font-black text-neo-ink">{label}</p>
              {email && name ? (
                <p className="truncate text-[10px] font-bold text-neo-muted">
                  {email}
                </p>
              ) : null}
            </div>
            <div className="flex max-h-[min(60vh,320px)] flex-col overflow-y-auto p-1.5">
              {(
                [
                  ["/dashboard", "Dashboard", "hover:bg-neo-cyan"],
                  ["/path", "Path", "hover:bg-neo-lime"],
                  ["/practice", "Practice", "hover:bg-neo-yellow"],
                  ["/review", "Review", "hover:bg-neo-orange"],
                  ["/shop", "Shop", "hover:bg-neo-yellow"],
                  ["/plus", "Plus", "hover:bg-neo-pink"],
                  ["/", "Home", "hover:bg-neo-pink"],
                ] as const
              ).map(([href, text, hover]) => (
                <Link
                  key={href}
                  href={href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`neo-press min-h-11 rounded-xl px-3 py-2.5 text-left text-xs font-black uppercase ${hover}`}
                >
                  {text}
                </Link>
              ))}
              <LogoutLink
                role="menuitem"
                className="neo-press min-h-11 rounded-xl bg-neo-pink px-3 py-2.5 text-left text-xs font-black uppercase"
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
