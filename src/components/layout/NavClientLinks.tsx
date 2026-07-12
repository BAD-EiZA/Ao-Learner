"use client";

import Link from "next/link";
import { useAppOptional } from "@/components/providers/AppProviders";
import { MobileNav } from "@/components/layout/MobileNav";

const desk =
  "neo-border neo-shadow-sm neo-press hidden min-h-11 items-center rounded-xl px-3 py-2 font-black uppercase md:inline-flex";

export function NavClientLinks() {
  const app = useAppOptional();
  const learn = app?.tr("nav_learn") ?? "Learn";
  const review = app?.tr("nav_review") ?? "Review";
  const plan = app?.tr("nav_plan") ?? "Plan";

  return (
    <>
      {/* Mobile: Learn + hamburger */}
      <Link
        href="/dashboard"
        className="neo-border neo-shadow-sm neo-press inline-flex min-h-11 items-center rounded-xl bg-neo-cyan px-3 py-2 font-black uppercase md:hidden"
      >
        {learn}
      </Link>
      <MobileNav />

      {/* Desktop strip */}
      <Link
        href="/dashboard"
        className={`${desk} bg-neo-cyan`}
      >
        {learn}
      </Link>
      <Link href="/path" className={`${desk} bg-neo-lime`}>
        Path
      </Link>
      <Link href="/practice" className={`${desk} bg-neo-yellow`}>
        Practice
      </Link>
      <Link href="/review" className={`${desk} bg-neo-orange`}>
        {review}
      </Link>
      <Link href="/plan" className={`${desk} bg-neo-pink lg:inline-flex`}>
        {plan}
      </Link>
      <Link
        href="/talk"
        className={`${desk} bg-neo-pink lg:inline-flex`}
      >
        Talk
      </Link>
      <Link
        href="/shop"
        className={`${desk} bg-neo-yellow lg:inline-flex`}
      >
        Shop
      </Link>
      {app && (
        <div className="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            className={`neo-border neo-shadow-sm min-h-9 min-w-9 rounded-lg px-2 text-[10px] font-black ${
              app.locale === "en" ? "bg-neo-ink text-neo-white" : "bg-neo-white"
            }`}
            onClick={() => app.setLocale("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={`neo-border neo-shadow-sm min-h-9 min-w-9 rounded-lg px-2 text-[10px] font-black ${
              app.locale === "id" ? "bg-neo-ink text-neo-white" : "bg-neo-white"
            }`}
            onClick={() => app.setLocale("id")}
          >
            ID
          </button>
          <button
            type="button"
            title={app.tr("reduced_motion")}
            className={`neo-border neo-shadow-sm min-h-9 rounded-lg px-2 text-[10px] font-black ${
              app.reducedMotion ? "bg-neo-ink text-neo-white" : "bg-neo-white"
            }`}
            onClick={() => app.setReducedMotion(!app.reducedMotion)}
          >
            {app.reducedMotion ? "Motion off" : "Motion"}
          </button>
        </div>
      )}
    </>
  );
}
