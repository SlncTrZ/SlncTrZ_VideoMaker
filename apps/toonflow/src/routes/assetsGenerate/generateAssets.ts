import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

type AssetType = "role" | "scene" | "tool";

interface AssetTypeConfig {
  label: string;
  taskClass: string;
  dir: string;
  promptTitle: string;
  promptEnd: string;
}

const assetTypeConfig: Record<AssetType, AssetTypeConfig> = {
  role: {
    label: "Character",
    taskClass: "character_image_generation",
    dir: "role",
    promptTitle: "Character Standard Four-View",
    promptEnd: "character four-view image",
  },
  scene: {
    label: "Scene",
    taskClass: "scene_image_generation",
    dir: "scene",
    promptTitle: "Standard Scene Image",
    promptEnd: "standard scene image",
  },
  tool: {
    label: "Prop",
    taskClass: "prop_image_generation",
    dir: "props",
    promptTitle: "Standard Prop Image",
    promptEnd: "standard prop image",
  },
};

// ─── Build generation prompt ──────────────────────────────────────────

function buildPrompt(cfg: AssetTypeConfig, artStyle: string, name: string, prompt: string): string {
  return `
    Generate ${cfg.promptTitle} based on the following parameters:

    **Basic Parameters:**
    - Art Style: ${artStyle || "Not specified"}

    **${cfg.label} Settings:**
    - Name:${name},
    - Prompt:${prompt},

    Please strictly follow system specifications to generate ${cfg.promptEnd}.
  `;
}

// ─── Generate asset image ────────────────────────────────────────────

const requestSchema = {
  projectId: z.number(),
  model: z.string(),
  resolution: z.string(),
  id: z.number(),
  type: z.enum(["role", "scene", "tool", "storyboard"]),
  name: z.string(),
  prompt: z.string(),
  base64: z.string().optional().nullable(),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { projectId, model, resolution, id, type, name, prompt, base64 } = req.body;

  // 1. Query project & get type config
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(success({ message: "Project is empty" }));

  const cfg = assetTypeConfig[type as AssetType];
  if (!cfg) return res.status(400).send(error("Unsupported type"));

  // 2. Create image placeholder record
  const [imageId] = await u.db("o_image").insert({
    type,
    state: "generating",
    assetsId: id,
    model: model.split(/:(.+)/)[1],
    resolution,
  });
  await u.db("o_assets").where("id", id).update({ imageId });

  // 3. Prepare generation parameters
  const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
  const userPrompt = buildPrompt(cfg, project.artStyle!, name, prompt);
  const describe = `Generate ${cfg.label} image, name: ${name}, prompt: ${prompt}`;
  const relatedObjects = { id, projectId, type: cfg.label };

  try {
    const aiImage = u.Ai.Image(model);
    await aiImage.run(
      {
        prompt: userPrompt,
        referenceList: base64 ? [{ type: "image", base64 }] : [],
        size: resolution,
        aspectRatio: "16:9",
      },
      {
        taskClass: cfg.taskClass,
        describe,
        projectId,
        relatedObjects: JSON.stringify(relatedObjects),
      },
    );
    aiImage.save(imagePath);
    // 5. Update record & return result
    const imageData = await u.db("o_image").where("id", imageId).select("*").first();
    if (!imageData) return res.status(500).send("Asset has been deleted");
    if (imageData.state === "failed") return;
    await u
      .db("o_image")
      .where("id", imageId)
      .update({
        state: "completed",
        filePath: imagePath,
        type,
        model: model.split(/:(.+)/)[1],
        resolution,
      });

    const path = await u.oss.getSmallImageUrl(imagePath);
    await u.db("o_assets").where("id", id).update({ imageId });

    return res.status(200).send(success({ path, assetsId: id }));
  } catch (e) {
    await u
      .db("o_image")
      .where("id", imageId)
      .update({ state: "failed", errorReason: u.error(e).message });
    return res.status(400).send(error(u.error(e).message || "Image generation failed"));
  }
});
