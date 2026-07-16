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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser install state is client-only
      setShow(true);
    } catch {
      /* */
    }
  }, []);

  if (!show) return null;

  return (
    <div className="neo-border rounded-xl bg-neo-white px-3 py-2 text-xs font-bold text-neo-ink shadow-lg">
      <p className="font-black">Install Ao</p>
      <p className="opacity-80">Add to home for streak reminders.</p>
      <button
        type="button"
        className="mt-1 min-h-11 underline"
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
