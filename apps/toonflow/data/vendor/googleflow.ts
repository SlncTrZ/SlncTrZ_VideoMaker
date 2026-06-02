/**
 * Toonflow Vendor — Google Flow (labs.google.com/fx)
 * Sends image & video generation requests via ws-bridge → extension → Google Flow
 * @version 1.1
 *
 * Image models: Nano Banana (via Google Flow)
 * Video models: Veo 3.1 (via Google Flow)
 *
 * Usage:
 *   1. Start ws-bridge: node tools/ws-bridge/ws-bridge-server.mjs
 *   2. Ensure SlncTrZ_Everything-GenAI extension is connected (auto-connect ws://localhost:1888)
 *   3. Select a model in Toonflow's image/video generation
 */

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel)[];
}

type ReferenceList =
  | { type: "image"; sourceType: "base64"; base64: string }
  | { type: "audio"; sourceType: "base64"; base64: string }
  | { type: "video"; sourceType: "base64"; base64: string };

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[];
}

interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

declare const axios: any;
declare const logger: (msg: string) => void;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;

const vendor: VendorConfig = {
  id: "googleflow",
  version: "1.0",
  name: "Google Flow (Veo 3.1)",
  author: "MeiLin",
  description: "Veo 3.1 video generation via Google Flow (labs.google.com/fx) through ws-bridge",
  icon: "🎬",
  inputs: [
    { key: "bridgeUrl", label: "WS-Bridge URL (HTTP)", type: "url", required: true, placeholder: "http://localhost:1889" },
  ],
  inputValues: {
    bridgeUrl: "http://localhost:10588/api/bridge",
  },
  models: [
    {
      name: "Nano Banana Pro",
      modelName: "google/nano-banana-pro/text-to-image",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Nano Banana 2",
      modelName: "google/nano-banana-2/text-to-image",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Nano Banana Fast",
      modelName: "google/nano-banana-fast/text-to-image",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Veo 3.1 Fast",
      modelName: "google/veo-3.1-fast/text-to-video",
      type: "video",
      mode: ["text", "singleImage", "startFrameOptional"],
      audio: "optional",
      durationResolutionMap: [{ duration: [5, 8, 10], resolution: ["720p"] }],
    },
    {
      name: "Veo 3.1 Lite",
      modelName: "google/veo-3.1-lite/text-to-video",
      type: "video",
      mode: ["text", "singleImage", "startFrameOptional"],
      audio: "optional",
      durationResolutionMap: [{ duration: [5, 8, 10], resolution: ["720p"] }],
    },
    {
      name: "Veo 3.1 Quality",
      modelName: "google/veo-3.1-quality/text-to-video",
      type: "video",
      mode: ["text", "singleImage", "startFrameOptional"],
      audio: "optional",
      durationResolutionMap: [{ duration: [5, 8, 10], resolution: ["720p", "1080p"] }],
    },
  ],
};

const bridgeUrl = () => vendor.inputValues.bridgeUrl.replace(/\/+$/, "");

const modelPrettyName: Record<string, string> = {
  // Image models (Nano Banana)
  "google/nano-banana-pro/text-to-image": "Nano Banana Pro",
  "google/nano-banana-2/text-to-image": "Nano Banana 2",
  "google/nano-banana-fast/text-to-image": "Nano Banana Fast",
  // Video models (Veo 3.1)
  "google/veo-3.1-fast/text-to-video": "Veo 3.1 Fast",
  "google/veo-3.1-lite/text-to-video": "Veo 3.1 Lite",
  "google/veo-3.1-quality/text-to-video": "Veo 3.1 Quality",
};

async function textRequest(model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3): Promise<any> {
  throw new Error("Google Flow vendor does not support text generation");
}

async function sendToBridge(command: any): Promise<string> {
  const baseUrl = bridgeUrl();
  const commandId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  command.id = commandId;

  const sendRes = await axios.post(baseUrl, command, {
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });

  if (sendRes.data?.error) {
    throw new Error(`Bridge error: ${sendRes.data.error}`);
  }

  const result = await pollTask(async () => {
    try {
      const pollRes = await axios.get(`${baseUrl}/result/${commandId}`, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      });
      const data = pollRes.data;

      if (!data || data.status === "pending" || data.status === "no_result") {
        return { completed: false };
      }

      if (data.status === "completed" && data.results?.length > 0) {
        const url = data.results[0];
        if (typeof url === "string" && url.startsWith("http")) {
          return { completed: true, data: url };
        }
        if (typeof url?.url === "string") {
          return { completed: true, data: url.url };
        }
        if (typeof url?.imageUrl === "string") {
          return { completed: true, data: url.imageUrl };
        }
      }

      if (data.status === "failed") {
        return { completed: true, error: data.error || "Generation failed" };
      }

      return { completed: false };
    } catch (err: any) {
      if (err?.code === "ECONNREFUSED" || err?.code === "ECONNRESET" || err?.message?.includes("timeout")) {
        return { completed: false };
      }
      throw err;
    }
  }, 3000, 300000);

  if (result.error) throw new Error(result.error);
  return result.data || "";
}

async function imageRequest(config: any, model: ImageModel): Promise<string> {
  const prettyName = modelPrettyName[model.modelName] || model.name;

  const images = (config.referenceList?.filter((r: any) => r.type === "image") || []).map((r: any) => r.base64);

  const command = {
    action: "execute",
    provider: "flow",
    prompts: [config.prompt],
    images: images,
    config: {
      mode: "image",
      model: prettyName,
      size: config.size || "1K",
      ratio: config.aspectRatio || "16:9",
    },
  };

  return await sendToBridge(command);
}

async function videoRequest(config: VideoConfig, model: VideoModel): Promise<string> {
  const prettyName = modelPrettyName[model.modelName] || "Veo 3.1 Fast";

  const mode = Array.isArray(config.mode) ? config.mode[0] : config.mode;
  const images = (config.referenceList?.filter((r) => r.type === "image") || []).map((r) => r.base64);

  logger(`[GoogleFlow] Video: model=${prettyName}, mode=${mode}, images=${images.length}`);

  const command: any = {
    action: "execute",
    provider: "flow",
    prompts: [config.prompt],
    images: images,
    config: {
      mode: "video",
      videoMode: mode,
      model: prettyName,
      duration: config.duration || 5,
      ratio: config.aspectRatio || "16:9",
      resolution: config.resolution || "720p",
    },
  };

  // Chế độ image-to-video: cần truyền start frame
  if (mode === "singleImage" && images.length > 0) {
    command.config.startImage = images[0];
  }
  // Chế độ start frame (có optional end frame)
  if (mode === "startFrameOptional" && images.length > 0) {
    command.config.startImage = images[0];
    if (images.length > 1) command.config.endImage = images[1];
  }

  return await sendToBridge(command);
}

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
