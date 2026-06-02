import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { useSkill } from "@/utils/agent/skillsTools";
import { tool, jsonSchema } from "ai";
import { o_script } from "@/types/database";

const router = express.Router();

/** New asset: AI first-time identified asset, requires full info */
const NewAssetSchema = z.object({
  name: z.string().describe("Asset name, just the name without any other description"),
  desc: z.string().describe("Asset description"),
  type: z.enum(["role", "tool", "scene"]).describe("Asset type"),
  scriptIds: z.array(z.number()).describe("Array of script IDs that use this asset"),
});

/** Existing asset: already exists in DB, just provide name and associated scripts */
const ExistingAssetRefSchema = z.object({
  name: z.string().describe("Existing asset name, must exactly match name in existing asset list"),
  scriptIds: z.array(z.number()).describe("Array of script IDs that use this asset"),
});

export const AssetSchema = z.object({
  name: z.string().describe("Asset name, just the name without any other description"),
  desc: z.string().describe("Asset description"),
  type: z.enum(["role", "tool", "scene"]).describe("Asset type"),
});

type NewAsset = z.infer<typeof NewAssetSchema>;
type ExistingAssetRef = z.infer<typeof ExistingAssetRefSchema>;
type Asset = z.infer<typeof AssetSchema>;

/** Result of each batch AI call */
type GroupResult = {
  batchScriptIds: number[];
  newAssets: NewAsset[];
  existingRefs: ExistingAssetRef[];
} | null;

/** Group scriptIds array by groupSize */
function chunkArray(arr: number[], groupSize: number): number[][][] {
  const chunks: number[][] = [];
  for (let i = 0; i < arr.length; i += 5) {
    chunks.push(arr.slice(i, i + 5));
  }
  const groupChunks = [];
  for (let i = 0; i < chunks.length; i += groupSize) {
    groupChunks.push(chunks.slice(i, i + groupSize));
  }
  return groupChunks;
}

export default router.post(
  "/",
  validateFields({
    scriptIds: z.array(z.number()),
    projectId: z.number(),
    groupSize: z.number().min(1).optional(),
  }),
  async (req, res) => {
    const { scriptIds, projectId, groupSize = 5 } = req.body;

    if (!scriptIds.length) return res.status(400).send(error("Please select scripts first"));
    const scripts = await u.db("o_script").whereIn("id", scriptIds);

    // Build scriptId -> script content map
    const scriptMap = new Map(scripts.map((s: o_script) => [s.id, s]));

    await u.db("o_script").whereIn("id", scriptIds).update({
      extractState: 2,
    });

    const errors: { scriptId: number; error: string }[] = [];
    let successCount = 0;

    // Group scriptIds by groupSize (default 5), send each group to AI together
    const scriptGroups = chunkArray(scriptIds as number[], groupSize);

    /** Persist group extraction results and establish associations */
    async function persistGroupResult(result: GroupResult) {
      console.log("%c Line:84 🍪 result", "background:#6ec1c2", result);
      if (!result) return;
      const { batchScriptIds, newAssets, existingRefs } = result;
      if (!newAssets.length && !existingRefs.length) return;

      // Query existing assets
      const existingAssets = await u.db("o_assets").where("projectId", projectId).select("id", "name");
      const existingMap = new Map(existingAssets.map((a) => [a.name!, a.id!]));

      // Insert new assets (not in existing list)
      const toInsert = newAssets.filter((asset) => !existingMap.has(asset.name));
      if (toInsert.length) {
        await u.db("o_assets").insert(
          toInsert.map((asset) => ({
            name: asset.name,
            type: asset.type,
            describe: asset.desc,
            projectId: projectId,
            startTime: Date.now(),
          })),
        );
      }

      // Re-query to get complete name -> id mapping
      const allAssets = await u.db("o_assets").where("projectId", projectId).select("id", "name");
      const nameToId = new Map(allAssets.map((a) => [a.name, a.id]));

      // Collect all asset-script associations
      const scriptAssetRows: { scriptId: number; assetId: number }[] = [];

      // New asset associations
      for (const asset of newAssets) {
        const assetId = nameToId.get(asset.name);
        if (assetId) {
          for (const sid of asset.scriptIds) {
            scriptAssetRows.push({ scriptId: sid, assetId });
          }
        }
      }

      // Existing asset associations
      for (const ref of existingRefs) {
        const assetId = nameToId.get(ref.name);
        if (assetId) {
          for (const sid of ref.scriptIds) {
            scriptAssetRows.push({ scriptId: sid, assetId });
          }
        }
      }

      // Deduplicate: keep only one entry per scriptId + assetId
      const uniqueRows = [...new Map(scriptAssetRows.map((r) => [`${r.scriptId}_${r.assetId}`, r])).values()];

      // Delete old associations for this batch of scriptIds, then insert new ones
      await u.db("o_scriptAssets").whereIn("scriptId", batchScriptIds).delete();
      if (uniqueRows.length) {
        await u.db("o_scriptAssets").insert(uniqueRows);
      }

      // Update successful scripts status to 1 (success)
      await u.db("o_script").whereIn("id", batchScriptIds).update({
        extractState: 1,
        errorReason: null,
      });
    }
    res.send(success("Asset extraction started"));

    function processGroup(group: number[][][]) {
      group.map(async (itemIds) => {
        const validScripts: { id: number; script: o_script }[] = [];
        for (const scriptIds of itemIds as number[][]) {
          for (const scriptId of scriptIds) {
            const script = scriptMap.get(scriptId);
            if (!script) {
              errors.push({ scriptId, error: "Script not found" });
              await u.db("o_script").where("id", scriptId).update({ extractState: -1, errorReason: "Script not found" });
            } else {
              // Check if status is pending extraction, only process pending ones
              const item = await u.db("o_script").where("id", scriptId).select("extractState").first();
              if (item?.extractState == 2) {
                validScripts.push({ id: scriptId, script });
              }
            }
          }
        }
        if (!validScripts.length) return;
        const validScriptIds = validScripts.map((v) => v.id);
        // Update status to extracting
        await u.db("o_script").whereIn("id", validScriptIds).update({
          extractState: 0, // extracting
        });
        // Query existing assets for the project to provide as AI reference
        const existingAssets = await u.db("o_assets").where("projectId", projectId).select("name", "type");
        const existingAssetsList = existingAssets.map((a) => `${a.name}(${a.type})`).join("、");

        // Concatenate multi-episode script content with separators
        const scriptsContent = validScripts
          .map(({ id, script }) => `===== [Script ID: ${id}] ${script.name || ""} =====\n${script.content}`)
          .join("\n\n");

        let collectedNew: NewAsset[] = [];
        let collectedExisting: ExistingAssetRef[] = [];
        try {
          const resultTool = tool({
            description: "Must call this tool when returning results",
            inputSchema: jsonSchema<{ newAssets: NewAsset[]; existingAssetRefs: ExistingAssetRef[] }>(
              z
                .object({
                  newAssets: z
                    .array(NewAssetSchema)
                    .describe("Newly discovered assets (not in existing asset list), requires full prompt, name, desc, type and scriptIds using this asset"),
                  existingAssetRefs: z
                    .array(ExistingAssetRefSchema)
                    .describe("Existing asset references (already in existing asset list), just provide asset name and scriptIds using it"),
                })
                .toJSONSchema(),
            ),
            execute: async ({ newAssets, existingAssetRefs }) => {
              if (newAssets?.length) collectedNew = newAssets;
              if (existingAssetRefs?.length) collectedExisting = existingAssetRefs;
              return "No need to reply to user";
            },
          });
          const promptData = await u.db("o_prompt").where("type", "scriptAssetExtraction").first();
          let scriptAssetExtraction = "" as string | undefined;
          if (promptData && promptData.useData) {
            scriptAssetExtraction = promptData.useData;
          } else {
            scriptAssetExtraction = promptData?.data ?? undefined;
          }
          const existingHint = existingAssetsList
            ? `\n\n[Existing assets]: ${existingAssetsList}\nFor existing assets appearing in scripts, just provide the asset name and corresponding scriptIds array in existingAssetRefs, no need to regenerate desc/type. For newly discovered assets (not in existing list), provide complete info in newAssets.`
            : "";
          const output = await u.Ai.Text("universalAi").invoke({
            messages: [
              {
                role: "system",
                content:
                  scriptAssetExtraction +
                  "\n\nExtract assets involved in scripts (characters, scenes, props), reference the script_assets_extract skill specification. Results must be returned via the resultTool." +
                  "\n\nNote: Multiple scripts will be provided simultaneously, each separated by ===== [Script ID: xxx] =====",
              },
              {
                role: "user",
                content: `Current existing assets: ${existingHint}\n\nExtract script assets (characters, scenes, props) from the following ${validScripts.length} scripts:\n\n${scriptsContent}`,
              },
            ],
            tools: { resultTool },
          });
          await persistGroupResult({
            batchScriptIds: validScriptIds,
            newAssets: collectedNew,
            existingRefs: collectedExisting,
          });
        } catch (e) {
          console.error(`[extractAssets] group=[${validScriptIds.join(",")}] extraction failed:`, e);
          for (const { id, script } of validScripts) {
            errors.push({ scriptId: id, error: (script.name || "") + ":" + u.error(e).message });
            await u
              .db("o_script")
              .where("id", id)
              .update({ extractState: -1, errorReason: u.error(e).message });
          }
          return;
        }
        if (!collectedNew.length && !collectedExisting.length) {
          for (const { id } of validScripts) {
            errors.push({ scriptId: id, error: "AI did not return any assets" });
            await u.db("o_script").where("id", id).update({ extractState: -1, errorReason: "AI did not return any assets" });
          }
          return;
        }
      });
    }
    processGroup(scriptGroups);
  },
);
