import express from "express";
import pLimit from "p-limit";
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

const requestSchema = {
  projectId: z.number(),
  model: z.string(),
  resolution: z.string(),
  concurrentCount: z.number().int().min(1).optional(),
  items: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["role", "scene", "tool", "storyboard"]),
      name: z.string(),
      prompt: z.string(),
      base64: z.string().optional().nullable(),
    }),
  ),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { projectId, model, resolution, concurrentCount, items } = req.body;

  // 1. Query project
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(error("Project is empty"));

  // 2. Insert o_image placeholder records, collect imageId list
  const totalNovelId: number[] = [];
  for (const item of items) {
    const [imageId] = await u.db("o_image").insert({
      type: item.type,
      state: "generating",
      assetsId: item.id,
    });
    await u.db("o_assets").where("id", item.id).update({ imageId });
    totalNovelId.push(imageId);
  }

  // 3. Async concurrent generation in background, don't block response
  const limit = pLimit(concurrentCount ?? 1);

  const tasks = items.map((item: { id: number; type: string; name: string; prompt: string; base64: string | null | undefined }, index: number) =>
    limit(async () => {
      const imageId = totalNovelId[index];
      const data = await u.db("o_image").where("id", imageId).select("state").first();
      if (data?.state === "failed") {
        return;
      }
      const cfg = assetTypeConfig[item.type as AssetType];
      if (!cfg) return;

      await u.db("o_assets").where("id", item.id).update({ imageId });

      const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
      const userPrompt = buildPrompt(cfg, project.artStyle ?? "", item.name, item.prompt);
      const describe = `Generate ${cfg.label} image, name: ${item.name}, prompt: ${item.prompt}`;
      const relatedObjects = { id: item.id, projectId, type: cfg.label };
      try {
        const aiImage = u.Ai.Image(model);
        await aiImage.run(
          {
            prompt: userPrompt,
            referenceList: item.base64 ? [{ base64: item.base64, type: "image" }] : [],
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

        const imageData = await u.db("o_image").where("id", imageId).select("*").first();
        if (!imageData) return res.status(500).send("Asset has been deleted");
        if (!imageData) return;
        if (imageData.state === "failed") return;
        await u
          .db("o_image")
          .where("id", imageId)
          .update({
            state: "completed",
            filePath: imagePath,
            type: item.type,
            model: model.split(/:(.+)/)[1],
            resolution,
          });

        await u.db("o_assets").where("id", item.id).update({ imageId });
      } catch (e: any) {
        await u
          .db("o_image")
          .where("id", imageId)
          .update({ state: "failed", errorReason: u.error(e).message });
      }
    }),
  );

  // Run in background, don't wait for results
  Promise.all(tasks).catch(() => {});

  return res.status(200).send(success({ total: items.length }));
});
