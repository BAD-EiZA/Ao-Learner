"use client";

import { NeoCard } from "@/components/ui/neo";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
  tone = "white",
  compact = false,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "white" | "cyan" | "lime" | "pink" | "orange";
  compact?: boolean;
}) {
  return (
    <NeoCard tone={tone} hover={false} className="space-y-3 text-center" role="status">
      {!compact && (
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl neo-border bg-neo-info text-3xl"
          aria-hidden
        >
          ∅
        </div>
      )}
      <p className={compact ? "font-black" : "text-lg font-black"}>{title}</p>
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
    <NeoCard tone="danger" hover={false} className="space-y-3 text-center" role="alert">
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
