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
  /** Bump to force re-play even if animationUrl is unchanged */
  animationNonce?: number;
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

function stripQuery(url: string) {
  return url.split("?")[0] ?? url;
}

function loadClip(url: string, vrm: VRM): Promise<THREE.AnimationClip | null> {
  const clean = stripQuery(url);
  const cacheKey = `${clean}::${vrm.scene.uuid}`;
  const existing = clipCache.get(cacheKey);
  if (existing) return existing;

  const promise = new Promise<THREE.AnimationClip | null>((resolve) => {
    const animLoader = new GLTFLoader();
    animLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
    animLoader.load(
      clean,
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
  animationNonce = 0,
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
  animationNonce?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const vrmRef = useRef<VRM | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const currentLoopRef = useRef(true);
  const oneShotDoneRef = useRef(false);
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
    if (!animationUrl) return;
    let alive = true;
    const requestId = Symbol("anim");

    const run = async () => {
      let tries = 0;
      while ((!vrmRef.current || !mixerRef.current) && tries < 100) {
        await new Promise((r) => setTimeout(r, 40));
        tries++;
        if (!alive) return;
      }
      const vrm = vrmRef.current;
      const mixer = mixerRef.current;
      if (!vrm || !mixer || !alive) return;

      const clip = await loadClip(animationUrl, vrm);
      if (!alive || !clip || !mixerRef.current || vrmRef.current !== vrm) return;

      const mixerNow = mixerRef.current;
      const next = mixerNow.clipAction(clip);
      const prev = currentActionRef.current;
      const wantLoop = loopRef.current;
      const fade = Math.max(0.4, fadeRef.current);

      // Skip only if same looping idle is already running
      if (
        currentUrlRef.current === animationUrl &&
        currentLoopRef.current === wantLoop &&
        wantLoop &&
        prev === next &&
        prev.isRunning() &&
        prev.getEffectiveWeight() > 0.9
      ) {
        applyEmotion(vrm, emotionRef.current);
        return;
      }

      // teardown previous finished listener
      if (finishedListenerRef.current) {
        mixerNow.removeEventListener(
          "finished",
          finishedListenerRef.current as unknown as () => void
        );
        finishedListenerRef.current = null;
      }
      oneShotDoneRef.current = false;

      next.enabled = true;
      next.paused = false;
      next.setEffectiveTimeScale(1);
      next.setLoop(
        wantLoop ? THREE.LoopRepeat : THREE.LoopOnce,
        wantLoop ? Infinity : 1
      );
      next.clampWhenFinished = !wantLoop;

      if (!wantLoop) {
        const onFinished = (e: { action: THREE.AnimationAction }) => {
          if (e.action !== next || oneShotDoneRef.current) return;
          oneShotDoneRef.current = true;
          finishedCbRef.current?.();
        };
        finishedListenerRef.current = onFinished;
        mixerNow.addEventListener(
          "finished",
          onFinished as unknown as () => void
        );
      }

      // Always start one-shots from t=0; blend from previous if different
      if (prev && prev !== next) {
        next.reset();
        next.setEffectiveWeight(1);
        next.play();
        // fade previous out while next is already at full weight path
        try {
          prev.crossFadeTo(next, fade, true);
        } catch {
          prev.fadeOut(fade);
        }
        // ensure next is audible even if crossFade glitches
        next.setEffectiveWeight(1);
      } else {
        next.reset();
        next.setEffectiveWeight(1);
        next.play();
      }

      currentActionRef.current = next;
      currentUrlRef.current = animationUrl;
      currentLoopRef.current = wantLoop;
      applyEmotion(vrm, emotionRef.current);
      void requestId;
    };

    void run();
    return () => {
      alive = false;
    };
  }, [animationUrl, loopAnimation, animationNonce]);

  useEffect(() => {
    const vrm = vrmRef.current;
    if (vrm) applyEmotion(vrm, emotion);
  }, [emotion]);

  useFrame((_, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    if (mixerRef.current && currentActionRef.current) {
      mixerRef.current.update(delta);

      // Fallback finish for one-shots (VRMA often skips mixer "finished")
      const action = currentActionRef.current;
      if (
        action &&
        !currentLoopRef.current &&
        !oneShotDoneRef.current
      ) {
        const dur = action.getClip().duration;
        const t = action.time;
        // require some progress so we don't finish on frame 0
        if (dur > 0.05 && t >= Math.max(0.2, dur - 0.08)) {
          oneShotDoneRef.current = true;
          finishedCbRef.current?.();
        }
      }
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
  backgroundColor = "#F4CEFF",
  onAnimationFinished,
  onReady,
  animationNonce = 0,
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
            animationNonce={animationNonce}
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
