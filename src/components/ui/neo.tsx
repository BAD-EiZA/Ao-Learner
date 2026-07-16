"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ReactNode } from "react";

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

export type Tone =
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "surface"
  | "yellow"
  | "pink"
  | "cyan"
  | "lime"
  | "purple"
  | "orange"
  | "white"
  | "ink";

const tones: Record<Tone, string> = {
  primary: "bg-neo-primary text-neo-white",
  info: "bg-neo-info text-neo-ink",
  success: "bg-neo-success text-white",
  warning: "bg-neo-warning text-neo-warning-ink",
  danger: "bg-neo-danger text-neo-danger-ink",
  surface: "bg-neo-white text-neo-ink",
  yellow: "bg-neo-primary text-neo-white",
  pink: "bg-neo-danger text-neo-danger-ink",
  cyan: "bg-neo-info text-neo-ink",
  lime: "bg-neo-success text-white",
  purple: "bg-neo-purple text-neo-ink",
  orange: "bg-neo-warning text-neo-warning-ink",
  white: "bg-neo-white text-neo-ink",
  ink: "bg-neo-ink text-neo-white", // #1B4EF5
};

export function NeoCard({
  children,
  className,
  tone = "white",
  hover = false,
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
        "neo-border rounded-2xl p-4",
        hover && "neo-shadow",
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

export function NeoLink({
  children,
  className,
  tone = "primary",
  ...props
}: LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
    className?: string;
    tone?: Tone;
  }) {
  return (
    <Link
      className={cn(
        "neo-border neo-shadow inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black uppercase tracking-wide sm:px-5 sm:py-3",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </Link>
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
        "neo-border inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide",
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
        "neo-border rounded-lg px-2.5 py-1.5 text-center text-xs font-bold",
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
