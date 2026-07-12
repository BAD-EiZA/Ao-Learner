"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const press = {
  whileHover: { y: -2 },
  whileTap: { x: 3, y: 3, boxShadow: "1px 1px 0 #1B4EF5" },
  transition: { type: "spring" as const, stiffness: 500, damping: 28 },
};

function motionSafe() {
  if (typeof document === "undefined") return press;
  if (document.documentElement.classList.contains("reduce-motion")) {
    return {
      whileHover: undefined,
      whileTap: undefined,
      transition: { duration: 0 },
    };
  }
  return press;
}

type Tone =
  | "yellow"
  | "pink"
  | "cyan"
  | "lime"
  | "purple"
  | "orange"
  | "white"
  | "ink";

/** Mapped to ColorHunt: deep / mid / light / soft */
const tones: Record<Tone, string> = {
  yellow: "bg-neo-yellow text-neo-white", // #3874FF
  pink: "bg-neo-pink text-neo-ink", // #F4CEFF
  cyan: "bg-neo-cyan text-neo-white", // #5996FF
  lime: "bg-neo-lime text-neo-white", // #5996FF
  purple: "bg-neo-purple text-neo-ink", // #F4CEFF
  orange: "bg-neo-orange text-neo-white", // #3874FF
  white: "bg-neo-white text-neo-ink",
  ink: "bg-neo-ink text-neo-white", // #1B4EF5
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
      {...(hover ? motionSafe() : {})}
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
        "neo-border neo-shadow inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wide sm:px-5 sm:py-3",
        tones[tone],
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...motionSafe()}
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
