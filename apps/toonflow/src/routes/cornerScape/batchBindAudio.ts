import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { tool, jsonSchema } from "ai";
const router = express.Router();

// Get assets
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    assetsIds: z.array(z.number()),
    concurrentCount: z.number().min(1).optional(),
  }),
  async (req, res) => {
    const { projectId, assetsIds, concurrentCount } = req.body;
    const assetsData = await u.db("o_assets").whereIn("id", assetsIds).andWhere("projectId", projectId).select("id", "name", "describe", "type");

    const audioData = await u
      .db("o_assets")
      .where("type", "audio")
      .whereNull("assetsId")
      .andWhere("projectId", projectId)
      .select("id", "name", "describe");

    if (!audioData.length) return res.status(400).send(error("No audio configured, please upload audio in Asset Center first"));

    const batchSize = concurrentCount ?? 1;

    async function processAsset(asset: (typeof assetsData)[number]) {
      try {
        const resultTool = tool({
          description: "Must call this tool to submit result after matching",
          inputSchema: jsonSchema<{ id: number; audioId: number }>(
            z
              .object({
                audioId: z.number().nullable().optional().describe("Audio ID matching this asset, null if no match found"),
              })
              .toJSONSchema(),
          ),
          execute: async (result) => {
            await u.db("o_assetsRole2Audio").where("assetsRoleId", asset.id).delete();
            if (result?.audioId) await u.db("o_assetsRole2Audio").insert({ assetsRoleId: asset.id, assetsAudioId: result.audioId });
            await u.db("o_assets").where("id", asset.id).update("audioBindState", "completed");
            return "No need to reply to user";
          },
        });

        const audioList = audioData.map((i) => `- ID:${i.id} | Name:${i.name} | Description:${i.describe ?? "None"}`).join("\n");
        const promptData = await u.db("o_prompt").where("type", "audioBindPrompt").first();
        let audioBindPrompt = "" as string | undefined;
        if (promptData && promptData.useData) {
          audioBindPrompt = promptData.useData;
        } else {
          audioBindPrompt = promptData?.data ?? undefined;
        }
        const { text } = await u.Ai.Text("universalAi").invoke({
          messages: [
            {
              role: "system",
              content: `
              ${audioBindPrompt}
              `,
            },
            {
              role: "user",
              content: `
                ## Candidate Audio List
                ${audioList}
                ## Assets to Match
                - ID:${asset.id} | Name:${asset.name} | Description:${asset.describe ?? "None"} | Type: ${asset.type}
                Please select the most suitable audio for this asset from the candidate list and call resultTool to submit the result.
           `,
            },
          ],
          tools: { resultTool },
        });
      } catch (e) {
        await u.db("o_assets").where("id", asset.id).update("audioBindState", "generation_failed");
        console.error(`[bindAudio] Asset ${asset.id} processing failed:`, e);
      }
    }

    async function runWithConcurrency() {
      for (let i = 0; i < assetsData.length; i += batchSize) {
        const batch = assetsData.slice(i, i + batchSize);

        await Promise.all(batch.map((asset) => processAsset(asset)));
      }
    }
    await u
      .db("o_assets")
      .whereIn(
        "id",
        assetsData.map((i) => i.id),
      )
      .update("audioBindState", "generating");
    runWithConcurrency();
    res.status(200).send(success());
  },
);
