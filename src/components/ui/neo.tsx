"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const press = {
  whileHover: { y: -2 },
  whileTap: { x: 3, y: 3, boxShadow: "1px 1px 0 #111111" },
  transition: { type: "spring" as const, stiffness: 500, damping: 28 },
};

type Tone =
  | "yellow"
  | "pink"
  | "cyan"
  | "lime"
  | "purple"
  | "orange"
  | "white"
  | "ink";

const tones: Record<Tone, string> = {
  yellow: "bg-neo-yellow text-neo-ink",
  pink: "bg-neo-pink text-neo-ink",
  cyan: "bg-neo-cyan text-neo-ink",
  lime: "bg-neo-lime text-neo-ink",
  purple: "bg-neo-purple text-neo-ink",
  orange: "bg-neo-orange text-neo-ink",
  white: "bg-neo-white text-neo-ink",
  ink: "bg-neo-ink text-neo-white",
};

export function NeoCard({
  children,
  className,
  tone = "white",
  hover = true,
  ...props
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  hover?: boolean;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(
        "neo-border neo-shadow rounded-2xl p-4",
        tones[tone],
        className
      )}
      {...(hover ? press : {})}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function NeoButton({
  children,
  className,
  tone = "yellow",
  disabled,
  type = "button",
  ...props
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
} & Omit<HTMLMotionProps<"button">, "type">) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={cn(
        "neo-border neo-shadow inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-black uppercase tracking-wide",
        tones[tone],
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...press}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function NeoBadge({
  children,
  className,
  tone = "cyan",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "neo-border neo-shadow-sm inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function NeoChip({
  children,
  className,
  tone = "white",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "neo-border neo-shadow-sm rounded-lg px-2.5 py-1.5 text-center text-[11px] font-bold sm:text-xs",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function NeoPanel({
  children,
  className,
  tone = "white",
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "neo-border neo-shadow-lg overflow-hidden rounded-3xl",
        tones[tone],
        className
      )}
    >
      {children}
    </div>
  );
}

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 320, damping: 28 },
};

export const stagger = {
  animate: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export function MotionItem({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} {...fadeUp} {...props}>
      {children}
    </motion.div>
  );
}
