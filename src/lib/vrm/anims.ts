import type { Emotion } from "@/lib/constants";

export const ANIM_KEYS = [
  "LookAround",
  "Thinking",
  "Clapping",
  "Jump",
  "Blush",
  "Relax",
  "Sad",
  "Sleepy",
  "Angry",
  "Surprised",
  "Goodbye",
  "ShowFullBody",
  "Greeting",
  "PeaceSign",
  "Shoot",
  "Spin",
  "ModelPose",
  "Squat",
] as const;

export type AnimKey = (typeof ANIM_KEYS)[number];

export type AnimDef = {
  key: AnimKey;
  url: string;
  emotion: Emotion;
};

/** Expression follows filename / intent */
export const VRM_ANIMS: Record<AnimKey, AnimDef> = {
  LookAround: {
    key: "LookAround",
    url: "/anims/LookAround.vrma",
    emotion: "neutral",
  },
  Thinking: {
    key: "Thinking",
    url: "/anims/Thinking.vrma",
    emotion: "neutral",
  },
  Clapping: {
    key: "Clapping",
    url: "/anims/Clapping.vrma",
    emotion: "joy",
  },
  Jump: {
    key: "Jump",
    url: "/anims/Jump.vrma",
    emotion: "joy",
  },
  Blush: {
    key: "Blush",
    url: "/anims/Blush.vrma",
    emotion: "fun",
  },
  Relax: {
    key: "Relax",
    url: "/anims/Relax.vrma",
    emotion: "fun",
  },
  Sad: {
    key: "Sad",
    url: "/anims/Sad.vrma",
    emotion: "sorrow",
  },
  Sleepy: {
    key: "Sleepy",
    url: "/anims/Sleepy.vrma",
    emotion: "sorrow",
  },
  Angry: {
    key: "Angry",
    url: "/anims/Angry.vrma",
    emotion: "angry",
  },
  Surprised: {
    key: "Surprised",
    url: "/anims/Surprised.vrma",
    emotion: "fun",
  },
  Goodbye: {
    key: "Goodbye",
    url: "/anims/Goodbye.vrma",
    emotion: "sorrow",
  },
  // VRMA_01–07
  ShowFullBody: {
    key: "ShowFullBody",
    url: "/anims/ShowFullBody.vrma",
    emotion: "neutral",
  },
  Greeting: {
    key: "Greeting",
    url: "/anims/Greeting.vrma",
    emotion: "joy",
  },
  PeaceSign: {
    key: "PeaceSign",
    url: "/anims/PeaceSign.vrma",
    emotion: "fun",
  },
  Shoot: {
    key: "Shoot",
    url: "/anims/Shoot.vrma",
    emotion: "fun",
  },
  Spin: {
    key: "Spin",
    url: "/anims/Spin.vrma",
    emotion: "joy",
  },
  ModelPose: {
    key: "ModelPose",
    url: "/anims/ModelPose.vrma",
    emotion: "neutral",
  },
  Squat: {
    key: "Squat",
    url: "/anims/Squat.vrma",
    emotion: "fun",
  },
};

const PASS_POOL_HIGH: AnimKey[] = ["Clapping", "Jump", "Spin", "PeaceSign"];
const PASS_POOL_MID: AnimKey[] = ["Blush", "Relax", "Greeting", "ShowFullBody"];
const FAIL_POOL: AnimKey[] = ["Sad", "Sleepy", "Surprised", "Squat", "Angry"];

function pickRandom(keys: AnimKey[]): AnimDef {
  const key = keys[Math.floor(Math.random() * keys.length)]!;
  return VRM_ANIMS[key];
}

/** Pick VRMA + emotion from eval score (with variety) */
export function pickAnimForScore(
  score: number,
  opts?: { hitLimit?: boolean; isCorrect?: boolean }
): AnimDef {
  if (opts?.hitLimit) return VRM_ANIMS.Goodbye;

  if (score >= 95) return pickRandom(["Clapping", "Jump", "Spin"]);
  if (score >= 90) return pickRandom(["Clapping", "PeaceSign", "Jump"]);
  if (score >= 85) return pickRandom(["Jump", "Spin", "ShowFullBody"]);
  if (score >= 80) return pickRandom(["Blush", "PeaceSign", "Greeting"]);
  if (score >= 75) return pickRandom(["Greeting", "Blush", "Relax"]);
  if (score >= 70) return pickRandom(["Relax", "ShowFullBody", "Blush"]);
  if (score >= 65) return pickRandom(["Relax", "Greeting"]);
  if (score >= 60) return pickRandom(PASS_POOL_MID);

  if (score >= 50) return pickRandom(["Sad", "Surprised", "Squat"]);
  if (score >= 40) return pickRandom(["Sad", "Sleepy"]);
  if (score >= 30) return pickRandom(["Sleepy", "Surprised"]);
  if (score >= 20) return pickRandom(["Surprised", "Angry", "Squat"]);
  if (score >= 10) return pickRandom(["Angry", "Sad"]);
  return VRM_ANIMS.Angry;
}

/** Home click reactions (play once then return to idle) */
export function pickHomeClickAnim(): AnimDef {
  return Math.random() < 0.5 ? VRM_ANIMS.Greeting : VRM_ANIMS.Spin;
}

export function animFromKey(key: AnimKey): AnimDef {
  return VRM_ANIMS[key];
}

// silence unused for tree-shake friendliness in some tools
void PASS_POOL_HIGH;
void FAIL_POOL;
