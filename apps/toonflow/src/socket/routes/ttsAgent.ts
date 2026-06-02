import jwt from "jsonwebtoken";
import u from "@/utils";
import { Namespace, Socket } from "socket.io";
import ResTool from "@/socket/resTool";
import { tool, jsonSchema } from "ai";
import { z } from "zod";
import * as fs from "fs";
import path from "path";

async function verifyToken(rawToken: string): Promise<Boolean> {
  const setting = await u.db("o_setting").where("key", "tokenKey").select("value").first();
  if (!setting) return false;
  const { value: tokenKey } = setting;
  if (!rawToken) return false;
  const token = rawToken.replace("Bearer ", "");
  try {
    jwt.verify(token, tokenKey as string);
    return true;
  } catch (err) {
    return false;
  }
}

async function buildProfileIdsPrompt(): Promise<string> {
  try {
    const vendorConfig = await u.db("o_vendorConfig").where("id", "omnivoice").first();
    if (!vendorConfig) return "";
    const modelList = await u.vendor.getModelList("omnivoice");
    const ttsModels = modelList.filter((m: any) => m.type === "tts");
    if (!ttsModels.length) return "";
    const voices = ttsModels.flatMap((m: any) => m.voices || []);
    if (!voices.length) return "";
    const profileList = voices.map((v: any) => `  <profile_id id="${v.voice}">${v.title}</profile_id>`).join("\n");
    return `\n## Available Voice Profile IDs\nYou can use the following voice profile IDs with the generate_tts tool. Each profile_id maps to a distinct character voice:\n<profile_ids>\n${profileList}\n</profile_ids>`;
  } catch {
    return "";
  }
}

function removeAllXmlTags(text: string): string {
  text = text.replace(/<([a-zA-Z][\w-]*)(\s+[^>]*)?>([\s\S]*?)<\/\1>/g, "");
  text = text.replace(/<([a-zA-Z][\w-]*)(\s+[^>]*)?\/>/g, "");
  text = text.replace(/<\/?[a-zA-Z][\w-]*(\s+[^>]*)?>/g, "");
  return text.trim();
}

async function consumeFullStream(
  fullStream: AsyncIterable<any>,
  initialMsg: ReturnType<ResTool["newMessage"]>,
): Promise<string> {
  let msg = initialMsg;
  let text = msg.text();
  let thinking: ReturnType<typeof msg.thinking> | null = null;
  let thinkTime = 0;
  let fullResponse = "";

  try {
    for await (const chunk of fullStream) {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1));
      if (chunk.type === "reasoning-start") {
        thinkTime = Date.now();
        thinking = msg.thinking("Thinking...");
      } else if (chunk.type === "reasoning-delta") {
        thinking?.append(chunk.text);
      } else if (chunk.type === "reasoning-end") {
        thinkTime = Date.now() - thinkTime;
        thinking?.updateTitle(`Thought (${(thinkTime / 1000).toFixed(1)}s)`);
        thinking?.complete();
        thinking = null;
      } else if (chunk.type === "text-delta") {
        text.append(chunk.text);
        fullResponse += chunk.text;
      } else if (chunk.type === "error") {
        throw chunk.error;
      }
    }
    text.complete();
    msg.complete();
  } catch (err: any) {
    thinking?.complete();
    const errMsg = err?.message ?? String(err);
    text.append(errMsg);
    text.error();
    msg.error();
    throw err;
  }

  return fullResponse;
}

export default (nsp: Namespace) => {
  nsp.on("connection", async (socket: Socket) => {
    const token = socket.handshake.auth.token;
    if (!token || !(await verifyToken(token))) {
      console.log("[ttsAgent] 连接失败，token无效");
      socket.disconnect();
      return;
    }
    const isolationKey = socket.handshake.auth.isolationKey;
    if (!isolationKey) {
      console.log("[ttsAgent] 连接失败，缺少 isolationKey");
      socket.disconnect();
      return;
    }

    console.log("[ttsAgent] 已连接:", socket.id);

    const resTool = new ResTool(socket, {
      projectId: socket.handshake.auth.projectId,
    });
    let abortController: AbortController | null = null;

    socket.on("chat", async (data: { content: string }) => {
      const { content } = data;
      abortController?.abort();
      abortController = new AbortController();
      const currentController = abortController;

      const msg = resTool.newMessage("assistant", "TTS Agent");

      try {
        const skill = path.join(u.getPath("skills"), "production_execution_tts.md");
        const skillContent = await fs.promises.readFile(skill, "utf-8");
        const langInstruction = "\n\n## Language Instruction\nIMPORTANT: Always respond in English. All status messages, logs, and outputs MUST be in English.";
        const profileIdsPrompt = await buildProfileIdsPrompt();
        const systemPrompt = skillContent + langInstruction + profileIdsPrompt;

        const { fullStream } = await u.Ai.Text("productionAgent:ttsAgent").stream({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ],
          abortSignal: currentController.signal,
          tools: {
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
                  } as any, { projectId, taskClass: "tts", describe: `TTS: ${text.substring(0, 30)}...` } as any);

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
          },
          onFinish: async (completion) => {
            const memory = new (await import("@/utils/agent/memory")).default("ttsAgent", isolationKey);
            await memory.add("assistant:tts", removeAllXmlTags(completion.text));
          },
        });

        await consumeFullStream(fullStream, msg);
      } catch (err: any) {
        if (err.name !== "AbortError" && !currentController.signal.aborted) {
          console.error("[ttsAgent] chat error:", u.error(err).message);
          msg.error(u.error(err).message);
        }
      } finally {
        if (abortController === currentController) {
          abortController = null;
        }
      }
    });

    socket.on("updateThinkConfig", (data: { think: boolean; thinlLevel: 0 | 1 | 2 | 3 }) => {
      console.log("[ttsAgent] 更新思考配置:", data);
    });

    socket.on("stop", () => {
      abortController?.abort();
      abortController = null;
    });
  });
  nsp.on("disconnect", (socket: Socket) => {
    console.log("[ttsAgent] 已断开连接:", socket.id);
  });
};
