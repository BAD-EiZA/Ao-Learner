"use client";

import { NeoCard } from "@/components/ui/neo";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
  tone = "white",
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "white" | "cyan" | "lime" | "pink" | "orange";
}) {
  return (
    <NeoCard tone={tone} hover={false} className="space-y-3 text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl neo-border bg-neo-yellow text-3xl"
        aria-hidden
      >
        ∅
      </div>
      <p className="text-lg font-black">{title}</p>
      {body ? <p className="text-sm font-medium opacity-80">{body}</p> : null}
      {action}
    </NeoCard>
  );
}

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <NeoCard tone="orange" hover={false} className="space-y-3 text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl neo-border bg-neo-pink text-3xl font-black"
        aria-hidden
      >
        !
      </div>
      <p className="text-lg font-black uppercase">{title}</p>
      {body ? <p className="text-sm font-medium opacity-90">{body}</p> : null}
      {action}
    </NeoCard>
  );
}
