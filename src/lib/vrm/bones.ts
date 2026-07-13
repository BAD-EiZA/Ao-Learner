/** Exact VRM0 humanoid bone names from public/model.vrm */
export const VRM_BONE_NAMES = [
  "hips",
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "leftToes",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
  "rightToes",
  // fingers (available on this model)
  "leftThumbProximal",
  "leftThumbIntermediate",
  "leftThumbDistal",
  "leftIndexProximal",
  "leftIndexIntermediate",
  "leftIndexDistal",
  "leftMiddleProximal",
  "leftMiddleIntermediate",
  "leftMiddleDistal",
  "leftRingProximal",
  "leftRingIntermediate",
  "leftRingDistal",
  "leftLittleProximal",
  "leftLittleIntermediate",
  "leftLittleDistal",
  "rightThumbProximal",
  "rightThumbIntermediate",
  "rightThumbDistal",
  "rightIndexProximal",
  "rightIndexIntermediate",
  "rightIndexDistal",
  "rightMiddleProximal",
  "rightMiddleIntermediate",
  "rightMiddleDistal",
  "rightRingProximal",
  "rightRingIntermediate",
  "rightRingDistal",
  "rightLittleProximal",
  "rightLittleIntermediate",
  "rightLittleDistal",
] as const;

export type VrmBoneName = (typeof VRM_BONE_NAMES)[number];

/** Prefer these for tutor gestures (safe, visible) */
export const VRM_GESTURE_BONES = [
  "head",
  "neck",
  "spine",
  "chest",
  "leftUpperArm",
  "leftLowerArm",
  "rightUpperArm",
  "rightLowerArm",
  "leftHand",
  "rightHand",
  "leftShoulder",
  "rightShoulder",
] as const;

/** Exact emotion presets on this VRM (blendShapeMaster) */
export const VRM_EMOTION_PRESETS = [
  "neutral",
  "joy",
  "sorrow",
  "angry",
  "fun",
  "surprised",
] as const;

export function isKnownBone(name: string): name is VrmBoneName {
  return (VRM_BONE_NAMES as readonly string[]).includes(name);
}
