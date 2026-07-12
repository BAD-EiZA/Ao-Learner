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
        <NeoBadge tone="pink">English · Deutsch · 3D AI Tutor</NeoBadge>
        <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-neo-ink sm:text-5xl lg:text-6xl">
          Speak with Ao.
          <br />
          <span className="rounded-xl bg-neo-yellow px-2 neo-border">
            Get scored.
          </span>
          <br />
          Level up.
        </h1>
        <p className="max-w-xl text-sm font-medium leading-relaxed text-neo-muted sm:text-base">
          Short speaking stages, live pronunciation feedback from Gemini, and a
          VRM avatar that reacts with emotion, motion, and lip-sync. Fail 3
          times? 3-hour cooldown keeps practice disciplined.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {authed ? (
            <Link href="/dashboard">
              <NeoButton tone="pink" className="w-full sm:w-auto">
                Open dashboard
              </NeoButton>
            </Link>
          ) : (
            <>
              <RegisterLink postLoginRedirectURL="/dashboard">
                <NeoButton tone="pink" className="w-full sm:w-auto">
                  Start free
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
        <div className="grid grid-cols-3 gap-2">
          <NeoChip tone="cyan">Sequential stages</NeoChip>
          <NeoChip tone="lime">Score ≥ 60 pass</NeoChip>
          <NeoChip tone="orange">3 tries · 3h lock</NeoChip>
        </div>
      </motion.div>

      <motion.div className="order-1 lg:order-2" variants={fadeUp}>
        <NeoPanel tone="white" className="bg-neo-white">
          <div className="h-[48vh] min-h-[300px] sm:h-[56vh] lg:h-[min(70vh,640px)]">
            <HomeAvatar />
          </div>
          <p className="border-t-4 border-neo-ink bg-neo-yellow px-4 py-2 text-center text-[11px] font-black uppercase tracking-wide text-neo-ink">
            Click model · Drag to rotate · Pinch/scroll zoom
          </p>
        </NeoPanel>
      </motion.div>
    </motion.div>
  );
}
