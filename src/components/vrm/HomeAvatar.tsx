"use client";

import { useCallback, useState } from "react";
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

  const onFinished = useCallback(() => {
    // smooth return to idle model pose
    setAnim(IDLE);
    setLoop(true);
    setBusy(false);
  }, []);

  const onClick = useCallback(() => {
    if (busy) return;
    const next = pickHomeClickAnim();
    setBusy(true);
    setLoop(false);
    setAnim(next);
  }, [busy]);

  return (
    <div className="relative h-full w-full">
      <AvatarViewer
        autoRotate={false}
        interactive={!busy}
        className="h-full w-full"
        emotion={anim.emotion}
        animationUrl={anim.url}
        loopAnimation={loop}
        fadeDuration={0.5}
        onAnimationFinished={onFinished}
        backgroundColor="#fff1c9"
        modelY={0.1}
        cameraPosition={[0, 1.45, 1.85]}
        cameraTarget={[0, 1.15, 0]}
      />
      <button
        type="button"
        aria-label={busy ? "Playing animation" : "Play greeting or spin"}
        disabled={busy}
        onClick={onClick}
        className={`absolute inset-0 z-10 rounded-3xl ${
          busy ? "cursor-wait" : "cursor-pointer"
        }`}
      />
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] font-black uppercase tracking-wide text-neo-ink/70">
        {busy ? `${anim.key}…` : "Click model · Greeting / Spin"}
      </p>
    </div>
  );
}
