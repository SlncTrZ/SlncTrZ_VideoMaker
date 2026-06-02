import { tool, jsonSchema, Tool } from "ai";
import u from "@/utils";
import { z } from "zod";
import _ from "lodash";
import ResTool from "@/socket/resTool";

export const ScriptSchema = z.object({
  name: z.string().describe("Script name"),
  content: z.string().describe("Script content"),
});
export const planData = z.object({
  storySkeleton: z.string().describe("Story skeleton"),
  adaptationStrategy: z.string().describe("Adaptation strategy"),
  script: z.string().describe("Script content"),
});

export type planData = z.infer<typeof planData>;

const keySchema = z.enum(Object.keys(planData.shape) as [keyof planData, ...Array<keyof planData>]);
const planDataKeyLabels = Object.fromEntries(
  Object.entries(planData.shape).map(([key, schema]) => [key, (schema as z.ZodTypeAny).description ?? key]),
) as Record<keyof planData, string>;

interface ToolConfig {
  resTool: ResTool;
  toolsNames?: string[];
  msg: ReturnType<ResTool["newMessage"]>;
}

export default (toolCpnfig: ToolConfig) => {
  const { resTool, toolsNames, msg } = toolCpnfig;
  const { socket } = resTool;
  const tools: Record<string, Tool> = {
    get_novel_events: tool({
      description: "Get chapter events",
      inputSchema: jsonSchema<{ chapterIndexs: number[] }>(
        z
          .object({
            chapterIndexs: z.array(z.number()).describe("Chapter indices"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ chapterIndexs }) => {
        console.log("[tools] get_novel_events", chapterIndexs);
        const thinking = msg.thinking("Querying chapter events...");
        const data = await u
          .db("o_novel")
          .where("projectId", resTool.data.projectId)
          .select("id", "chapterIndex as index", "reel", "chapter", "chapterData", "event", "eventState")
          .whereIn("chapterIndex", chapterIndexs);
        thinking.appendText("Querying chapters: " + chapterIndexs.join(","));
        const eventString = data.map((i: any) => [`Ch.${i.index}, Title:${i.chapter}, Event:${i.event}`].join("\n")).join("\n");
        thinking.appendText("Results:\n" + eventString);
        thinking.updateTitle("Chapter events completed");
        thinking.complete();
        return eventString ?? "No data";
      },
    }),
    get_planData: tool({
      description: "Get workspace data",
      inputSchema: jsonSchema<{ key: keyof planData }>(
        z
          .object({
            key: keySchema.describe("Data key"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ key }) => {
        console.log("[tools] get_planData", key);
        const thinking = msg.thinking(`Fetching ${planDataKeyLabels[key]} data...`);
        const planData: planData = await new Promise((resolve) => socket.emit("getPlanData", { key }, (res: any) => resolve(res)));
        thinking.appendText(`Fetched ${planDataKeyLabels[key]}:\n` + planData[key]);
        thinking.updateTitle(`Fetched ${planDataKeyLabels[key]}`);
        thinking.complete();
        return planData[key] ?? "No data";
      },
    }),
    get_novel_text: tool({
      description: "Get novel chapter original text",
      inputSchema: jsonSchema<{ chapterIndex: string }>(
        z
          .object({
            chapterIndex: z.string().describe("Chapter index"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ chapterIndex }) => {
        console.log("[tools] get_novel_text", chapterIndex);
        const thinking = msg.thinking(`Fetching chapter text...`);
        const data = await u.db("o_novel").where("projectId", resTool.data.projectId).where({ chapterIndex }).select("chapterData").first();
        const text = data && data?.chapterData ? data.chapterData : "";
        thinking.appendText(`Fetched text:\n` + text);
        thinking.updateTitle(`Chapter text fetched`);
        thinking.complete();
        return text ?? "No data";
      },
    }),
    get_script_content: tool({
      description: "Get script content",
      inputSchema: jsonSchema<{ ids: string[] }>(
        z
          .object({
            ids: z.array(z.string()).describe("Script IDs"),
          })
          .toJSONSchema(),
      ),
      execute: async ({ ids }) => {
        console.log("[tools] get_script_content", ids);
        const thinking = msg.thinking(`Fetching script content...`);
        const data = await u.db("o_script").whereIn("id", ids).select("content", "name");
        const text = data && data.length ? data.map((d) => `<scriptItem name="${d.name}">${d.content}</scriptItem>`).join("\n") : "";
        thinking.appendText(`Fetched script content:\n` + JSON.stringify(data, null, 2));
        thinking.updateTitle(`Script content fetched`);
        thinking.complete();
        return text ?? "No data";
      },
    }),
  };
  return toolsNames ? Object.fromEntries(Object.entries(tools).filter(([n]) => toolsNames.includes(n))) : tools;
};
