import { readFileSync } from "fs";

const buf = readFileSync("public/model.vrm");
const magic = buf.toString("utf8", 0, 4);
if (magic !== "glTF") {
  console.error("Not GLB");
  process.exit(1);
}

let offset = 12;
while (offset + 8 <= buf.length) {
  const chunkLen = buf.readUInt32LE(offset);
  const chunkType = buf.toString("utf8", offset + 4, offset + 8);
  if (chunkType === "JSON") {
    const json = buf.toString("utf8", offset + 8, offset + 8 + chunkLen);
    const gltf = JSON.parse(json);

    console.log("=== animations (glTF) ===");
    const anims = gltf.animations ?? [];
    console.log("count:", anims.length);
    for (const a of anims) {
      console.log(
        `  name=${a.name ?? "(unnamed)"} channels=${a.channels?.length ?? 0} samplers=${a.samplers?.length ?? 0}`
      );
    }

    console.log("\n=== extensions ===");
    console.log("extensionsUsed:", gltf.extensionsUsed);
    console.log("extensionsRequired:", gltf.extensionsRequired);

    const vrm0 = gltf.extensions?.VRM;
    if (vrm0) {
      console.log("\n=== VRM0 meta ===");
      console.log("  title:", vrm0.meta?.title);
      console.log("  exporterVersion:", vrm0.exporterVersion);
      console.log("  secondaryAnimation:", !!vrm0.secondaryAnimation);
      if (vrm0.secondaryAnimation) {
        const sa = vrm0.secondaryAnimation;
        console.log(
          "  boneGroups:",
          sa.boneGroups?.length ?? 0,
          "colliderGroups:",
          sa.colliderGroups?.length ?? 0
        );
      }
      console.log("  firstPerson:", !!vrm0.firstPerson);
      console.log("  lookAt:", vrm0.firstPerson?.lookAtTypeName);
    }

    // VRM1 animation?
    const vrmc = gltf.extensions?.VRMC_vrm;
    const spring = gltf.extensions?.VRMC_springBone;
    const anim = gltf.extensions?.VRMC_vrm_animation;
    console.log("\n=== VRM1-ish ===");
    console.log("  VRMC_vrm:", !!vrmc);
    console.log("  VRMC_springBone:", !!spring);
    console.log("  VRMC_vrm_animation:", !!anim);

    // skins / nodes hint
    console.log("\n=== scene stats ===");
    console.log("  nodes:", gltf.nodes?.length ?? 0);
    console.log("  meshes:", gltf.meshes?.length ?? 0);
    console.log("  skins:", gltf.skins?.length ?? 0);
    console.log("  materials:", gltf.materials?.length ?? 0);
  }
  offset += 8 + chunkLen;
  if (offset % 4) offset += 4 - (offset % 4);
}
