"use client";

import Link from "next/link";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { motion } from "framer-motion";
import {
  NeoBadge,
  NeoButton,
  NeoChip,
  NeoPanel,
  fadeUp,
  stagger,
} from "@/components/ui/neo";
import { HomeAvatar } from "@/components/vrm/HomeAvatar";

export function HomeHero({ authed }: { authed: boolean }) {
  return (
    <motion.div
      className="mx-auto grid w-full max-w-6xl gap-6 px-3 py-6 sm:px-6 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-10"
      variants={stagger}
      initial="initial"
      animate="animate"
    >
      <motion.div className="order-2 space-y-5 lg:order-1" variants={fadeUp}>
        <NeoBadge tone="pink">English · German · 3D AI Tutor</NeoBadge>
        <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-neo-ink sm:text-5xl lg:text-6xl">
          <span className="block py-1">Speak.</span>
          <span className="my-1 inline-block rounded-xl bg-neo-yellow px-3 py-2 neo-border text-neo-white">
            Get scored.
          </span>
          <span className="block py-1">Level up.</span>
        </h1>
        <p className="max-w-xl text-sm font-medium leading-relaxed text-neo-muted sm:text-base">
          Short speaking drills with Ao — a virtual tutor that listens to your
          pronunciation, gives instant feedback, and reacts with expression &
          motion. Miss 3 times? A 3-hour cool-down keeps practice disciplined.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {authed ? (
            <Link href="/dashboard">
              <NeoButton tone="pink" className="w-full sm:w-auto">
                Start learning
              </NeoButton>
            </Link>
          ) : (
            <>
              <RegisterLink postLoginRedirectURL="/dashboard">
                <NeoButton tone="pink" className="w-full sm:w-auto">
                  Try free
                </NeoButton>
              </RegisterLink>
              <LoginLink postLoginRedirectURL="/dashboard">
                <NeoButton tone="white" className="w-full sm:w-auto">
                  Log in
                </NeoButton>
              </LoginLink>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <NeoChip tone="cyan">Sequential stages</NeoChip>
          <NeoChip tone="lime">Pass ≥ 60</NeoChip>
          <NeoChip tone="orange">3 misses · 3h</NeoChip>
        </div>
      </motion.div>

      <motion.div className="order-1 lg:order-2" variants={fadeUp}>
        <NeoPanel tone="white" className="bg-neo-white">
          <div className="h-[36vh] min-h-[200px] sm:h-[48vh] sm:min-h-[280px] lg:h-[min(70vh,640px)]">
            <HomeAvatar />
          </div>
          <p className="border-t-4 border-neo-ink bg-neo-yellow px-4 py-2 text-center text-[11px] font-black uppercase tracking-wide text-neo-ink">
            Click Ao · Drag to rotate · Pinch/zoom
          </p>
        </NeoPanel>
      </motion.div>
    </motion.div>
  );
}
