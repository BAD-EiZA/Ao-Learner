"use client";

import { useAppOptional } from "@/components/providers/AppProviders";

export function FooterBar() {
  const app = useAppOptional();
  const year = new Date().getFullYear();
  const line = app?.tr("footer") ?? "Ao Learner · Speak · Score · Level up";
  return (
    <footer className="neo-border border-x-0 border-b-0 bg-neo-ink px-4 py-3 text-center text-xs font-bold text-neo-pink">
      {line} · © {year} by BAD-EiZA
    </footer>
  );
}
