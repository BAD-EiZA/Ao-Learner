"use client";

import { useEffect, useState } from "react";

export function InstallNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("ao_install_dismiss") === "1") return;
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error iOS
        window.navigator.standalone;
      if (standalone) return;
      setShow(true);
    } catch {
      /* */
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-[max(5.5rem,env(safe-area-inset-bottom))] right-3 z-40 max-w-[min(220px,calc(100vw-1.5rem))] neo-border neo-shadow rounded-xl bg-neo-white px-3 py-2 text-[11px] font-bold text-neo-ink">
      <p className="font-black">Install Ao</p>
      <p className="opacity-80">Add to home for streak reminders.</p>
      <button
        type="button"
        className="mt-1 min-h-9 underline"
        onClick={() => {
          localStorage.setItem("ao_install_dismiss", "1");
          setShow(false);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
