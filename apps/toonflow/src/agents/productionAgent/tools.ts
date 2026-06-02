import { tool, jsonSchema, Tool } from "ai";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";
import u from "@/utils";

const deriveAssetSchema = z.object({
  id: z.number().describe("Derived asset ID, null if creating new"),
  assetsId: z.number().describe("Related asset ID"),
  prompt: z.string().describe("Generation prompt"),
  name: z.string().describe("Derived asset name"),
  desc: z.string().describe("Derived asset description"),
  src: z.string().nullable().describe("Derived asset resource path"),
  state: z.enum(["pending", "generating", "completed", "failed"]).describe("Derived asset generation state"),
  type: z.enum(["role", "tool", "scene", "clip"]).describe("Derived asset type"),
});
export const assetItemSchema = z.object({
  id: z.number().describe("Asset unique identifier"),
  name: z.string().describe("Asset name"),
  type: z.enum(["role", "tool", "scene", "clip"]).describe("Asset type"),
  prompt: z.string().describe("Generation prompt"),
  desc: z.string().describe("Asset description"),
  derive: z.array(deriveAssetSchema).describe("Derived asset list"),
});
const storyboardSchema = z.object({
  id: z.number().describe("Storyboard ID, must be a real ID"),
  duration: z.number().describe("Duration (seconds)"),
  prompt: z.string().describe("Generation prompt"),
  associateAssetsIds: z.array(z.number()).describe("Related asset IDs list"),
  src: z.string().nullable().describe("Storyboard resource path"),
  index: z.number().nullable().optional().describe("Storyboard sort order"),
});
const workbenchDataSchema = z.object({
  name: z.string().describe("Project name"),
  duration: z.string().describe("Video duration"),
  resolution: z.string().describe("Resolution"),
  fps: z.string().describe("Frame rate"),
  cover: z.string().optional().describe("Cover image path"),
  gradient: z.string().optional().describe("Gradient color config"),
});
const posterItemSchema = z.object({
  id: z.number().describe("Poster ID"),
  image: z.string().describe("Poster image path"),
});
export const flowDataSchema = z.object({
  script: z.string().describe("Script content"),
  scriptPlan: z.string().describe("Shooting plan"),
  assets: z.array(assetItemSchema).describe("Derived assets"),
  storyboardTable: z.string().describe("Storyboard table"),
  storyboard: z.array(storyboardSchema).describe("Storyboard panels"),
});

export type FlowData = z.infer<typeof flowDataSchema>;

const keySchema = z.enum(Object.keys(flowDataSchema.shape) as [keyof FlowData, ...Array<keyof FlowData>]);
const flowDataKeyLabels = Object.fromEntries(
  Object.entries(flowDataSchema.shape).map(([key, schema]) => [key, (schema as z.ZodTypeAny).description ?? key]),
) as Record<keyof FlowData, string>;

interface ToolConfig {
  resTool: ResTool;
  toolsNames?: string[];
  msg: ReturnType<ResTool["newMessage"]>;
}

export default (toolCpnfig: ToolConfig) => {
  const { resTool, toolsNames, msg } = toolCpnfig;
  const { socket } = resTool;
  const tools: Record<string, Tool> = {
    get_flowData: tool({
      description: "Get workspace data",
      inputSchema: jsonSchema<{ key: keyof FlowData }>(
        z
          .object({
            key: keySchema.describe("Data key"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ key }) => {
        const thinking = msg.thinking(`Fetching ${flowDataKeyLabels[key]} data...`);
        console.log("[tools] get_flowData", key);
        const flowData: FlowData = await new Promise((resolve) => socket.emit("getFlowData", { key }, (res: any) => resolve(res)));
        thinking.appendText(`Fetched ${flowDataKeyLabels[key]}:\n` + JSON.stringify(flowData[key], null, 2));
        thinking.updateTitle(`Fetched ${flowDataKeyLabels[key]}`);
        thinking.complete();
        return flowData[key];
      },
    }),
    add_deriveAsset: tool({
      description: "Add or update derived asset",
      inputSchema: jsonSchema<{ assetsId: number; id: number | null; name: string; desc: string }>(
        z
          .object({
            assetsId: z.number().describe("Related asset ID"),
            id: z.number().nullable().describe("Derived asset ID, null if creating new"),
            name: z.string().describe("Derived asset name"),
            desc: z.string().describe("Derived asset description"),
          })
          .toJSONSchema(),
      ),
      execute: async (raw) => {
        // Tolerance: LLM occasionally passes "null" string or empty string, normalize to null
        const idRaw = raw.id as unknown;
        const normalizedId = idRaw === "null" || idRaw === "" || idRaw === undefined ? null : (idRaw as number | null);
        const deriveAsset = { ...raw, id: normalizedId };

        const thinking = msg.thinking("Operating on asset...");
        const { projectId, scriptId } = resTool.data;
        const startTime = Date.now();
        const parentAssets = await u.db("o_assets").where("id", deriveAsset.assetsId).select("id", "type").first();
        if (!parentAssets) return "Associated asset not found";

        const data = {
          id: deriveAsset.id ?? undefined,
          assetsId: deriveAsset.assetsId,
          projectId,
          name: deriveAsset.name,
          type: parentAssets.type,
          describe: deriveAsset.desc,
          startTime,
        };
        if (deriveAsset.id) {
          await u.db("o_assets").where("id", deriveAsset.id).update(data);
          thinking.appendText(`Updated derived asset, ID: ${deriveAsset.id}\n`);
        } else {
          const [insertedId] = await u.db("o_assets").insert(data);
          data.id = insertedId;
          await u.db("o_scriptAssets").insert({ scriptId, assetId: insertedId });
          thinking.appendText(`Created derived asset, ID: ${insertedId}\n`);
        }
        const res = await new Promise((resolve) => socket.emit("addDeriveAsset", data, (res: any) => resolve(res)));
        thinking.updateTitle("Asset operation completed");
        thinking.complete();
        return res ?? "Operation successful";
      },
    }),
    del_deriveAsset: tool({
      description: "Delete derived asset",
      inputSchema: jsonSchema<{ assetsId: number; id: number }>(
        z
          .object({
            assetsId: z.number().describe("Related asset ID"),
            id: z.number().describe("Derived asset ID"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ assetsId, id }) => {
        const thinking = msg.thinking("Operating on asset...");
        const { scriptId } = resTool.data;
        await u.db("o_assets").where("id", id).del();
        await u.db("o_scriptAssets").where({ scriptId, assetId: id }).del();
        thinking.appendText(`Deleted derived asset, ID: ${id}\n`);
        const res = await new Promise((resolve) => socket.emit("delDeriveAsset", { assetsId, id }, (res: any) => resolve(res)));
        thinking.updateTitle("Asset operation completed");
        thinking.complete();
        return res ?? "Delete successful";
      },
    }),
    generate_deriveAsset: tool({
      description: "Generate derived asset images",
      inputSchema: jsonSchema<{ ids: number[] }>(
        z
          .object({
            ids: z.array(z.number()).describe("Derived asset IDs to generate"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        const thinking = msg.thinking("Generating derived assets...");
        new Promise((resolve) => socket.emit("generateDeriveAsset", { ids }, (res: any) => resolve(res)))
          .then((res) => {
            thinking.appendText(`Generated derived assets, IDs: ${JSON.stringify(res, null, 2)}\n`);
            thinking.updateTitle("Asset generation started");
            thinking.complete();
          })
          .catch((e) => {
            thinking.appendText("Asset generation failed:\n" + u.error(e).message);
            thinking.updateTitle("Asset generation failed");
            thinking.complete();
          });

        return "Starting asset generation";
      },
    }),
    generate_tts: tool({
      description: "Generate TTS audio for character dialogue. 'voice' accepts comma-separated profile_ids for multi-character scenes (e.g. 'hero,villain'). The OmniVoice vendor maps each profile to a distinct voice.",
      inputSchema: jsonSchema<{ text: string; voice: string; speechRate?: number }>(
        z
          .object({
            text: z.string().describe("The dialogue text to synthesize into speech"),
            voice: z.string().describe("Voice profile ID(s). Comma-separated for multi-character: 'profile1,profile2'"),
            speechRate: z.number().optional().default(1.0).describe("Speech speed multiplier (0.5-2.0)"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ text, voice, speechRate }) => {
        const thinking = msg.thinking("Generating TTS audio...");
        const projectId = (await u.db("o_project").select("id").first())?.id;
        if (!projectId) throw new Error("No active project found");

        const result = await u.db("o_video").insert({
          projectId,
          filePath: "",
          time: Date.now(),
          state: "generating",
        });
        const taskId = result[0];

        try {
          const aiAudio = u.Ai.Audio("omnivoice:omnivoice/tts");
          const audioData = await aiAudio.run({
            text,
            voice,
            speechRate: speechRate ?? 1.0,
            pitchRate: 1.0,
            volume: 1.0,
          } as any, { projectId, taskClass: "tts", describe: `TTS: ${text.substring(0, 30)}...` });

          const savePath = `audio/tts/${projectId}/${Date.now()}.wav`;
          await aiAudio.save(savePath);

          await u.db("o_video").where("id", taskId).update({
            state: "completed",
            filePath: savePath,
          });

          thinking.appendText(`TTS done: voice="${voice}", textLength=${text.length}, path=${savePath}`);
          thinking.updateTitle("TTS completed");
          thinking.complete();
          return `TTS generated: voice=${voice}, textLength=${text.length} chars, saved to ${savePath}`;
        } catch (err: any) {
          await u.db("o_video").where("id", taskId).update({
            state: "failed",
            errorReason: err.message,
          });
          thinking.updateTitle("TTS failed");
          thinking.complete();
          throw new Error(`TTS failed: ${err.message}`);
        }
      },
    }),
    generate_storyboard: tool({
      description: "Generate storyboard images",
      inputSchema: jsonSchema<{ ids: number[] }>(
        z
          .object({
            ids: z.array(z.number()).describe("Storyboard IDs (must be real IDs, supports batch)"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        const thinking = msg.thinking("Generating storyboard images...");
        const { projectId, scriptId } = resTool.data;

        // Only process first storyboard for debugging
        const testIds = [ids[0]];
        console.log(`[generate_storyboard] Testing with 1 storyboard (id=${testIds[0]}), total requested=${ids.length}`);

        try {
          const storyboards = await u.db("o_storyboard")
            .whereIn("id", ids)
            .where("scriptId", scriptId)
            .where("projectId", projectId)
            .select("id", "prompt", "filePath");

          if (!storyboards.length) {
            thinking.updateTitle("No storyboards found");
            thinking.complete();
            return "No storyboards found for the given IDs";
          }

          const projectData = await u.db("o_project")
            .where("id", projectId)
            .select("imageModel", "imageQuality", "videoRatio")
            .first();

          if (!projectData?.imageModel) {
            thinking.updateTitle("No image model configured");
            thinking.complete();
            return "Project has no image model configured";
          }

          const model = projectData.imageModel as `${string}:${string}`;
          console.log(`[generate_storyboard] Using model=${model}, size=${projectData.imageQuality}, ratio=${projectData.videoRatio}, storyboards=${storyboards.length}`);
          const size = (projectData.imageQuality || "1K") as "1K" | "2K" | "4K";
          const ratio = (projectData.videoRatio || "16:9") as "16:9" | "9:16";

          const errors: string[] = [];
          let completed = 0;

          for (const sb of storyboards) {
            try {
              console.log(`[generate_storyboard] Starting storyboard ${sb.id}, model=${model}, prompt=${(sb.prompt || '').substring(0, 50)}...`);
              const imageCls = await u.Ai.Image(model).run(
                {
                  prompt: sb.prompt || "",
                  referenceList: [],
                  size,
                  aspectRatio: ratio,
                },
                {
                  taskClass: "generate_storyboard_image",
                  describe: "Storyboard image generation",
                  relatedObjects: JSON.stringify({ id: sb.id, projectId }),
                  projectId,
                },
              );

              const savePath = `/${projectId}/storyboard/${scriptId}/${u.uuid()}.jpg`;
              await imageCls.save(savePath);

              await u.db("o_storyboard").where("id", sb.id).update({
                filePath: savePath,
                state: "completed",
              });
              completed++;
              thinking.appendText(`✅ Storyboard ${sb.id} generated\n`);
            } catch (e: any) {
              const errMsg = u.error(e).message;
              console.log(`[generate_storyboard] FAILED storyboard ${sb.id}:`, e?.message || '(no message)', 'name:', e?.name, 'code:', e?.code, 'stack:', (e?.stack || '').substring(0, 200));
              errors.push(`Storyboard ${sb.id}: ${errMsg}`);
              await u.db("o_storyboard").where("id", sb.id).update({
                filePath: "",
                reason: u.error(e).message,
                state: "failed",
              });
            }
          }

          const summary = `Completed: ${completed}/${storyboards.length}` + (errors.length ? `, Errors: ${errors.length}` : "");
          thinking.updateTitle(summary);
          thinking.complete();
          return summary;
        } catch (e: any) {
          thinking.updateTitle("Storyboard generation failed");
          thinking.appendText(u.error(e).message);
          thinking.complete();
          return "Error: " + u.error(e).message;
        }
      },
    }),
  };

  return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
