"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMExpressionPresetName } from "@pixiv/three-vrm";
import {
  VRMAnimationLoaderPlugin,
  createVRMAnimationClip,
  type VRMAnimation,
} from "@pixiv/three-vrm-animation";
import type { Emotion } from "@/lib/constants";
import { VRM_URL } from "@/lib/constants";

export type BoneCommand = {
  boneName: string;
  rotation: [number, number, number];
};

type AvatarViewerProps = {
  modelUrl?: string;
  emotion?: Emotion;
  boneCommands?: BoneCommand[];
  animationUrl?: string | null;
  mouthOpen?: number;
  className?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  modelY?: number;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  loopAnimation?: boolean;
  /** Crossfade duration (seconds). Default 0.45 */
  fadeDuration?: number;
  /** Canvas clear color */
  backgroundColor?: string;
  /** Called when a non-looping clip finishes */
  onAnimationFinished?: () => void;
  onReady?: () => void;
};

const EMOTION_MAP: Record<Emotion, VRMExpressionPresetName | null> = {
  neutral: null,
  joy: VRMExpressionPresetName.Happy,
  sorrow: VRMExpressionPresetName.Sad,
  angry: VRMExpressionPresetName.Angry,
  fun: VRMExpressionPresetName.Relaxed,
};

const EXPRESSION_RESET = [
  VRMExpressionPresetName.Happy,
  VRMExpressionPresetName.Sad,
  VRMExpressionPresetName.Angry,
  VRMExpressionPresetName.Relaxed,
  VRMExpressionPresetName.Surprised,
];

const FADE_DEFAULT = 0.6;

function clearFace(vrm: VRM) {
  if (!vrm.expressionManager) return;
  for (const n of EXPRESSION_RESET) {
    vrm.expressionManager.setValue(n, 0);
  }
}

function applyEmotion(vrm: VRM, emotion: Emotion) {
  if (!vrm.expressionManager) return;
  clearFace(vrm);
  const target = EMOTION_MAP[emotion];
  if (target) vrm.expressionManager.setValue(target, 1);
}

function applyMouth(vrm: VRM, mouthOpen: number) {
  if (!vrm.expressionManager) return;
  const open = Math.min(1, Math.max(0, mouthOpen));
  vrm.expressionManager.setValue(VRMExpressionPresetName.Aa, open);
  vrm.expressionManager.setValue(
    VRMExpressionPresetName.Ih,
    open > 0.35 ? open * 0.35 : 0
  );
  vrm.expressionManager.setValue(
    VRMExpressionPresetName.Ou,
    open > 0.55 ? open * 0.25 : 0
  );
  if (open < 0.05) {
    vrm.expressionManager.setValue(VRMExpressionPresetName.Ih, 0);
    vrm.expressionManager.setValue(VRMExpressionPresetName.Ou, 0);
  }
}

const clipCache = new Map<string, Promise<THREE.AnimationClip | null>>();

function loadClip(url: string, vrm: VRM): Promise<THREE.AnimationClip | null> {
  const cacheKey = `${url}::${vrm.scene.uuid}`;
  const existing = clipCache.get(cacheKey);
  if (existing) return existing;

  const promise = new Promise<THREE.AnimationClip | null>((resolve) => {
    const animLoader = new GLTFLoader();
    animLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    animLoader.load(
      url,
      (animGltf) => {
        const animations = animGltf.userData.vrmAnimations as
          | VRMAnimation[]
          | undefined;
        const vrmAnimation = animations?.[0];
        if (!vrmAnimation) {
          console.warn("VRMA has no animations:", url);
          resolve(null);
          return;
        }
        resolve(createVRMAnimationClip(vrmAnimation, vrm));
      },
      undefined,
      (err) => {
        console.error("VRMA load failed", url, err);
        resolve(null);
      }
    );
  });
  clipCache.set(cacheKey, promise);
  return promise;
}

function VrmModel({
  url,
  emotion = "neutral",
  boneCommands = [],
  animationUrl,
  mouthOpen = 0,
  modelY = -0.85,
  loopAnimation = true,
  fadeDuration = FADE_DEFAULT,
  onAnimationFinished,
  onReady,
}: {
  url: string;
  emotion?: Emotion;
  boneCommands?: BoneCommand[];
  animationUrl?: string | null;
  mouthOpen?: number;
  modelY?: number;
  loopAnimation?: boolean;
  fadeDuration?: number;
  onAnimationFinished?: () => void;
  onReady?: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const vrmRef = useRef<VRM | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const finishedListenerRef = useRef<
    ((e: { action: THREE.AnimationAction }) => void) | null
  >(null);
  const idle = useRef(0);
  const emotionRef = useRef(emotion);
  const mouthRef = useRef(mouthOpen);
  const bonesRef = useRef(boneCommands);
  const loopRef = useRef(loopAnimation);
  const fadeRef = useRef(fadeDuration);
  const finishedCbRef = useRef(onAnimationFinished);

  useEffect(() => {
    emotionRef.current = emotion;
    mouthRef.current = mouthOpen;
    bonesRef.current = boneCommands;
    loopRef.current = loopAnimation;
    fadeRef.current = fadeDuration;
    finishedCbRef.current = onAnimationFinished;
  }, [
    emotion,
    mouthOpen,
    boneCommands,
    loopAnimation,
    fadeDuration,
    onAnimationFinished,
  ]);

  // Load VRM once
  useEffect(() => {
    let disposed = false;
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const vrm = gltf.userData.vrm as VRM;
        vrm.scene.rotation.y = Math.PI;
        if (group.current) {
          while (group.current.children.length) {
            group.current.remove(group.current.children[0]);
          }
          group.current.add(vrm.scene);
        }
        vrmRef.current = vrm;
        const mixer = new THREE.AnimationMixer(vrm.scene);
        mixerRef.current = mixer;
        applyEmotion(vrm, emotionRef.current);
        onReady?.();
      },
      undefined,
      (err) => console.error("VRM load failed", err)
    );

    return () => {
      disposed = true;
      if (mixerRef.current && finishedListenerRef.current) {
        mixerRef.current.removeEventListener(
          "finished",
          finishedListenerRef.current as unknown as () => void
        );
      }
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      currentActionRef.current = null;
      currentUrlRef.current = null;
      vrmRef.current = null;
    };
  }, [url, onReady]);

  // Smooth crossfade when animationUrl / loop changes
  useEffect(() => {
    let cancelled = false;
    if (!animationUrl) return;

    const run = async () => {
      // wait for VRM + mixer
      let tries = 0;
      while ((!vrmRef.current || !mixerRef.current) && tries < 80) {
        await new Promise((r) => setTimeout(r, 50));
        tries++;
        if (cancelled) return;
      }
      const vrm = vrmRef.current;
      const mixer = mixerRef.current;
      if (!vrm || !mixer || cancelled) return;

      const clip = await loadClip(animationUrl, vrm);
      if (cancelled || !clip || !mixerRef.current || vrmRef.current !== vrm)
        return;

      const mixerNow = mixerRef.current;
      const next = mixerNow.clipAction(clip);
      const prev = currentActionRef.current;
      const wantLoop = loopRef.current;
      const fade = Math.max(0.45, fadeRef.current);

      // SAME clip already current — never hard-reset (fixes LookAround→LookAround snap)
      if (prev === next || currentUrlRef.current === animationUrl) {
        if (prev && (prev === next || prev.getClip() === clip)) {
          // ensure still playing as loop idle without restarting time
          if (wantLoop) {
            prev.setLoop(THREE.LoopRepeat, Infinity);
            prev.clampWhenFinished = false;
            prev.enabled = true;
            prev.paused = false;
            prev.setEffectiveWeight(1);
            if (!prev.isRunning()) {
              // resume gently from current time, do not reset()
              prev.play();
            }
            // clear one-shot finished listener
            if (finishedListenerRef.current) {
              mixerNow.removeEventListener(
                "finished",
                finishedListenerRef.current as unknown as () => void
              );
              finishedListenerRef.current = null;
            }
          }
          currentActionRef.current = prev;
          currentUrlRef.current = animationUrl;
          applyEmotion(vrm, emotionRef.current);
          return;
        }
      }

      next.enabled = true;
      next.setEffectiveTimeScale(1);
      next.setLoop(
        wantLoop ? THREE.LoopRepeat : THREE.LoopOnce,
        wantLoop ? Infinity : 1
      );
      next.clampWhenFinished = !wantLoop;

      // finished callback for one-shots only
      if (finishedListenerRef.current) {
        mixerNow.removeEventListener(
          "finished",
          finishedListenerRef.current as unknown as () => void
        );
        finishedListenerRef.current = null;
      }
      if (!wantLoop) {
        const onFinished = (e: { action: THREE.AnimationAction }) => {
          if (e.action !== next) return;
          finishedCbRef.current?.();
        };
        finishedListenerRef.current = onFinished;
        mixerNow.addEventListener(
          "finished",
          onFinished as unknown as () => void
        );
      }

      if (prev && prev !== next) {
        // smooth blend: start next at weight 0, crossfade from prev
        next.reset();
        next.setEffectiveWeight(0);
        next.play();
        prev.crossFadeTo(next, fade, true);
      } else {
        // first play only
        next.reset();
        next.setEffectiveWeight(1);
        next.fadeIn(fade * 0.5);
        next.play();
      }

      currentActionRef.current = next;
      currentUrlRef.current = animationUrl;
      applyEmotion(vrm, emotionRef.current);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [animationUrl, loopAnimation]);

  useEffect(() => {
    const vrm = vrmRef.current;
    if (vrm) applyEmotion(vrm, emotion);
  }, [emotion]);

  useFrame((_, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    if (mixerRef.current && currentActionRef.current) {
      mixerRef.current.update(delta);
    } else {
      idle.current += delta;
      const t = idle.current;
      const humanoid = vrm.humanoid;
      const cmds = bonesRef.current;
      if (humanoid && cmds.length) {
        for (const cmd of cmds) {
          const bone = humanoid.getNormalizedBoneNode(
            cmd.boneName as Parameters<
              typeof humanoid.getNormalizedBoneNode
            >[0]
          );
          if (!bone) continue;
          bone.rotation.set(cmd.rotation[0], cmd.rotation[1], cmd.rotation[2]);
        }
        const spine = humanoid.getNormalizedBoneNode("spine");
        if (spine) spine.rotation.y += Math.sin(t * 0.5) * 0.02;
      }
    }

    applyEmotion(vrm, emotionRef.current);
    applyMouth(vrm, mouthRef.current);
    vrm.update(delta);
  });

  return <group ref={group} position={[0, modelY, 0]} />;
}

export const STANDING_POSE: BoneCommand[] = [
  { boneName: "spine", rotation: [0.02, 0, 0] },
  { boneName: "chest", rotation: [0.01, 0, 0] },
  { boneName: "leftUpperArm", rotation: [0.08, 0.08, 1.3] },
  { boneName: "leftLowerArm", rotation: [0.15, 0, 0.1] },
  { boneName: "rightUpperArm", rotation: [0.08, -0.08, -1.3] },
  { boneName: "rightLowerArm", rotation: [0.15, 0, -0.1] },
];

export const HOME_WELCOME_POSE = STANDING_POSE;

export function AvatarViewer({
  modelUrl = VRM_URL,
  emotion = "neutral",
  boneCommands,
  animationUrl = null,
  mouthOpen = 0,
  className,
  autoRotate = false,
  interactive = true,
  modelY = -0.85,
  cameraPosition = [0, 1.35, 2.0],
  cameraTarget = [0, 0.95, 0],
  loopAnimation = true,
  fadeDuration = FADE_DEFAULT,
  backgroundColor = "#fff1c9",
  onAnimationFinished,
  onReady,
}: AvatarViewerProps) {
  const bones = useMemo(
    () => boneCommands ?? STANDING_POSE,
    [boneCommands]
  );

  return (
    <div className={className ?? "h-full w-full min-h-[280px]"}>
      <Canvas
        camera={{ position: cameraPosition, fov: 32 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={[backgroundColor]} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[2, 4, 2]} intensity={1.35} />
        <Suspense fallback={null}>
          <VrmModel
            url={modelUrl}
            emotion={emotion}
            boneCommands={bones}
            animationUrl={animationUrl}
            mouthOpen={mouthOpen}
            modelY={modelY}
            loopAnimation={loopAnimation}
            fadeDuration={fadeDuration}
            onAnimationFinished={onAnimationFinished}
            onReady={onReady}
          />
          <Environment preset="city" />
          <ContactShadows
            position={[0, modelY, 0]}
            opacity={0.28}
            scale={6}
            blur={2.5}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={interactive}
          enableRotate={interactive}
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
          minDistance={1.3}
          maxDistance={3.2}
          target={cameraTarget}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.7}
        />
      </Canvas>
    </div>
  );
}
