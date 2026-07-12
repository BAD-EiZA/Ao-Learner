import { readFileSync } from "fs";

const buf = readFileSync("public/model.vrm");
const magic = buf.toString("utf8", 0, 4);
console.log("magic", magic, "size", buf.length);

if (magic !== "glTF") {
  console.error("Not a GLB/VRM container");
  process.exit(1);
}

let offset = 12;
while (offset + 8 <= buf.length) {
  const chunkLen = buf.readUInt32LE(offset);
  const chunkType = buf.toString("utf8", offset + 4, offset + 8);
  if (chunkType === "JSON") {
    const json = buf.toString("utf8", offset + 8, offset + 8 + chunkLen);
    const gltf = JSON.parse(json);
    console.log("extensionsUsed:", gltf.extensionsUsed);

    const vrm0 = gltf.extensions?.VRM;
    const vrm1 = gltf.extensions?.VRMC_vrm;

    if (vrm0?.humanoid?.humanBones) {
      console.log("\n=== VRM0 humanBones (exact names) ===");
      for (const b of vrm0.humanoid.humanBones) {
        const nodeName = gltf.nodes?.[b.node]?.name ?? "?";
        console.log(`  ${b.bone}  (node: ${nodeName})`);
      }
    }

    if (vrm1?.humanoid?.humanBones) {
      console.log("\n=== VRM1 humanBones (exact names) ===");
      for (const [k, v] of Object.entries(
        vrm1.humanoid.humanBones as Record<string, { node?: number }>
      )) {
        const nodeName =
          v.node != null ? (gltf.nodes?.[v.node]?.name ?? "?") : "?";
        console.log(`  ${k}  (node: ${nodeName})`);
      }
    }

    if (vrm0?.blendShapeMaster?.blendShapeGroups) {
      console.log("\n=== VRM0 blendshapes / emotions ===");
      for (const g of vrm0.blendShapeMaster.blendShapeGroups) {
        console.log(`  name=${g.name} preset=${g.presetName}`);
      }
    }

    if (vrm1?.expressions?.preset) {
      console.log("\n=== VRM1 expression presets ===");
      console.log(
        " ",
        Object.keys(vrm1.expressions.preset as object).join(", ")
      );
    }

    if (vrm1?.expressions?.custom) {
      console.log("\n=== VRM1 custom expressions ===");
      console.log(
        " ",
        Object.keys(vrm1.expressions.custom as object).join(", ")
      );
    }
  }
  offset += 8 + chunkLen;
  if (offset % 4) offset += 4 - (offset % 4);
}
