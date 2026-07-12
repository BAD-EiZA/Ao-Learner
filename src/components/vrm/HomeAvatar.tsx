"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarViewer } from "@/components/vrm/AvatarViewer";
import {
  pickHomeClickAnim,
  VRM_ANIMS,
  type AnimDef,
} from "@/lib/vrm/anims";

const IDLE = VRM_ANIMS.ModelPose;

export function HomeAvatar() {
  const [anim, setAnim] = useState<AnimDef>(IDLE);
  const [loop, setLoop] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);
  const busyRef = useRef(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafety = useCallback(() => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, []);

  const returnToIdle = useCallback(() => {
    clearSafety();
    busyRef.current = false;
    setBusy(false);
    setLoop(true);
    setAnim(IDLE);
    setNonce((n) => n + 1);
  }, [clearSafety]);

  const onFinished = useCallback(() => {
    if (!busyRef.current) return;
    returnToIdle();
  }, [returnToIdle]);

  const onClick = useCallback(() => {
    if (busyRef.current) return;
    const next = pickHomeClickAnim();
    busyRef.current = true;
    setBusy(true);
    setLoop(false);
    setAnim(next);
    setNonce((n) => n + 1);

    clearSafety();
    safetyTimer.current = setTimeout(() => {
      if (busyRef.current) returnToIdle();
    }, 10_000);
  }, [clearSafety, returnToIdle]);

  useEffect(() => () => clearSafety(), [clearSafety]);

  return (
    <div className="relative h-full w-full">
      <AvatarViewer
        autoRotate={false}
        interactive={!busy}
        className="h-full w-full"
        emotion={anim.emotion}
        animationUrl={anim.url}
        loopAnimation={loop}
        animationNonce={nonce}
        fadeDuration={0.5}
        onAnimationFinished={onFinished}
        backgroundColor="#F4CEFF"
        modelY={0.1}
        cameraPosition={[0, 1.45, 1.85]}
        cameraTarget={[0, 1.15, 0]}
      />
      <button
        type="button"
        aria-label={busy ? "Animation playing" : "Greet Ao"}
        disabled={busy}
        onClick={onClick}
        className={`absolute inset-0 z-10 rounded-3xl ${
          busy ? "cursor-wait" : "cursor-pointer"
        }`}
      />
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] font-black uppercase tracking-wide text-neo-ink/70">
        {busy ? `Ao · ${anim.key}…` : "Click Ao · Greet / spin"}
      </p>
    </div>
  );
}
