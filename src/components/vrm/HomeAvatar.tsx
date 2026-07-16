"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarViewer } from "@/components/vrm/AvatarViewer";
import {
  pickHomeClickAnim,
  pickHomeFidgetAnim,
  VRM_ANIMS,
  type AnimDef,
} from "@/lib/vrm/anims";

const IDLE = VRM_ANIMS.Idle;
const GREETING = VRM_ANIMS.Greeting;
const FIDGET_AFTER_MS = 5_000;
const ONESHOT_SAFETY_MS = 12_000;

export function HomeAvatar() {
  const [anim, setAnim] = useState<AnimDef>(GREETING);
  const [loop, setLoop] = useState(false);
  const [busy, setBusy] = useState(true);
  const [nonce, setNonce] = useState(0);
  const [greeted, setGreeted] = useState(false);
  const busyRef = useRef(true);
  const greetedRef = useRef(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fidgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafety = useCallback(() => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  }, []);

  const clearFidget = useCallback(() => {
    if (fidgetTimer.current) {
      clearTimeout(fidgetTimer.current);
      fidgetTimer.current = null;
    }
  }, []);

  const playOneShot = useCallback(
    (next: AnimDef) => {
      clearFidget();
      busyRef.current = true;
      setBusy(true);
      setLoop(false);
      setAnim(next);
      setNonce((n) => n + 1);
      clearSafety();
      safetyTimer.current = setTimeout(() => {
        if (!busyRef.current) return;
        // safety → force idle path via finished-like reset
        busyRef.current = false;
        greetedRef.current = true;
        setGreeted(true);
        setBusy(false);
        setLoop(true);
        setAnim(IDLE);
        setNonce((n) => n + 1);
      }, ONESHOT_SAFETY_MS);
    },
    [clearFidget, clearSafety]
  );

  const scheduleFidget = useCallback(() => {
    clearFidget();
    if (!greetedRef.current) return;
    fidgetTimer.current = setTimeout(() => {
      if (busyRef.current || !greetedRef.current) return;
      playOneShot(pickHomeFidgetAnim());
    }, FIDGET_AFTER_MS);
  }, [clearFidget, playOneShot]);

  const returnToIdle = useCallback(() => {
    clearSafety();
    busyRef.current = false;
    greetedRef.current = true;
    setGreeted(true);
    setBusy(false);
    setLoop(true);
    setAnim(IDLE);
    setNonce((n) => n + 1);
    scheduleFidget();
  }, [clearSafety, scheduleFidget]);

  // When safety forces idle without scheduleFidget, re-arm boredom timer
  useEffect(() => {
    if (!greeted || busy || anim.key !== IDLE.key || !loop) return;
    if (fidgetTimer.current) return;
    scheduleFidget();
  }, [greeted, busy, anim.key, loop, scheduleFidget]);

  const onFinished = useCallback(() => {
    if (!busyRef.current) return;
    returnToIdle();
  }, [returnToIdle]);

  const onClick = useCallback(() => {
    if (busyRef.current || !greetedRef.current) return;
    playOneShot(pickHomeClickAnim());
  }, [playOneShot]);

  useEffect(() => {
    safetyTimer.current = setTimeout(() => {
      if (busyRef.current && !greetedRef.current) returnToIdle();
    }, ONESHOT_SAFETY_MS);
    return () => {
      clearSafety();
      clearFidget();
    };
  }, [clearSafety, clearFidget, returnToIdle]);

  const [modelReady, setModelReady] = useState(false);
  const onReady = useCallback(() => setModelReady(true), []);

  return (
    <div className="relative h-full w-full">
      <AvatarViewer
        autoRotate={false}
        interactive={!busy && modelReady && greeted}
        className="h-full w-full"
        emotion={anim.emotion}
        animationUrl={anim.url}
        loopAnimation={loop}
        animationNonce={nonce}
        fadeDuration={0.65}
        onAnimationFinished={onFinished}
        onReady={onReady}
        backgroundColor="#F4CEFF"
        modelY={0.1}
        cameraPosition={[0, 1.45, 1.85]}
        cameraTarget={[0, 1.15, 0]}
      />
      <button
        type="button"
        aria-label={
          !modelReady
            ? "Loading Ao"
            : busy
              ? "Animation playing"
              : "Dance with Ao"
        }
        disabled={busy || !modelReady || !greeted}
        onClick={onClick}
        className={`absolute inset-0 z-10 rounded-3xl ${
          !modelReady || busy ? "cursor-wait" : "cursor-pointer"
        }`}
      />
      {modelReady && (
        <p className="pointer-events-none absolute bottom-3 left-0 right-0 z-[15] text-center text-xs font-black uppercase tracking-wide text-neo-ink/70">
          {busy ? `Ao · ${anim.key}…` : "Click Ao · Dance"}
        </p>
      )}
    </div>
  );
}
