import express from "express";
import u from "@/utils";
import * as zod from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();


type ItemType = "characters" | "props" | "scenes";

// Polish prompt
export default router.post(
  "/",
  validateFields({
    assetsId: zod.number(),
    projectId: zod.number(),
    type: zod.string(),
    name: zod.string(),
    describe: zod.string(),
  }),
  async (req, res) => {
    const { assetsId, projectId, type, name, describe } = req.body;
    // Get art style
    const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
    // Return error if project not found
    if (!project) return res.status(500).send(success({ message: "Project is empty" }));

    await u.db("o_assets").where("id", assetsId).update({ promptState: "generating" });

    // Check if asset is derivative
    const assetsData = await u.db("o_assets").where("id", assetsId).select("assetsId").first();
    if (!assetsData) return { code: 500, message: "Asset does not exist" };
    const typeConfig: Record<string, { promptKey: string; itemType: ItemType; label: string; nameLabel: string; visualManual: string }> = {
      role: {
        promptKey: "role-polish",
        itemType: "characters",
        label: "Character Standard Four Views",
        nameLabel: "Character",
        visualManual: assetsData.assetsId ? "art_character_derivative" : "art_character",
      },
      scene: {
        promptKey: "scene-polish",
        itemType: "scenes",
        label: "Scene",
        nameLabel: "Scene",
        visualManual: assetsData.assetsId ? "art_scene_derivative" : "art_scene",
      },
      tool: {
        promptKey: "tool-polish",
        itemType: "props",
        label: "Prop",
        nameLabel: "Prop",
        visualManual: assetsData.assetsId ? "art_prop_derivative" : "art_prop",
      },
    };

    const config = typeConfig[type];
    if (!config) return res.status(500).send(error("Unsupported type"));
    if (!config.visualManual) return res.status(500).send(error("Visual manual not defined"));
    // Get visual manual
    const visualManual = await u.getArtPrompt(project.artStyle as string, "art_skills", config.visualManual);
    if (!visualManual) return res.status(500).send(error("Visual manual not defined"));
    const systemPrompt = visualManual;
    try {
      const { _output } = (await u.Ai.Text("universalAi").invoke({
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `**Basic Parameters:**
      **${config.nameLabel} Setting:**
      - ${config.nameLabel} Name:${name},
      - ${config.nameLabel} Description:${describe},`,
          },
        ],
      })) as any;

      if (!_output) return res.status(500).send("Failed");
      await u.db("o_assets").where("id", assetsId).update({ prompt: _output, promptState: "completed" });

      res.status(200).send(success({ prompt: _output, assetsId }));
    } catch (e: any) {
      await u
        .db("o_assets")
        .where("id", assetsId)
        .update({ promptState: "failed", promptErrorReason: u.error(e).message });
      return res.status(500).send(error(e?.data?.error?.message ?? e?.message ?? "Generation failed"));
    }
  },
);
