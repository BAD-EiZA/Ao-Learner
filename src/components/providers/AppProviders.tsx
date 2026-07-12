"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n/messages";
import { t, type MessageKey } from "@/lib/i18n/messages";
import { trackClient } from "@/lib/analytics";

type AppSettings = {
  locale: Locale;
  reducedMotion: boolean;
  setLocale: (l: Locale) => void;
  setReducedMotion: (v: boolean) => void;
  tr: (key: MessageKey) => string;
};

const Ctx = createContext<AppSettings | null>(null);

const LOCALE_KEY = "ao_locale";
const MOTION_KEY = "ao_reduced_motion";

export function AppProviders({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [reducedMotion, setMotionState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const l = localStorage.getItem(LOCALE_KEY) as Locale | null;
      const m = localStorage.getItem(MOTION_KEY);
      if (l === "en" || l === "id") setLocaleState(l);
      if (m === "1") setMotionState(true);
      else if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setMotionState(true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [locale, reducedMotion, ready]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {
      /* ignore */
    }
    trackClient("locale_change", { locale: l });
  }, []);

  const setReducedMotion = useCallback((v: boolean) => {
    setMotionState(v);
    try {
      localStorage.setItem(MOTION_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
    trackClient("reduced_motion_toggle", { enabled: v });
  }, []);

  const tr = useCallback((key: MessageKey) => t(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, reducedMotion, setLocale, setReducedMotion, tr }),
    [locale, reducedMotion, setLocale, setReducedMotion, tr]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside AppProviders");
  return ctx;
}

/** Safe hook when provider might be missing (server components shouldn't call) */
export function useAppOptional() {
  return useContext(Ctx);
}
